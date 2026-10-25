#!/usr/bin/env python3
"""Publish static files only after checking the account and Free plan. No SDK dependency."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def aws(*args, json_output=False):
    command = ['aws', *args, '--region', 'us-east-1', '--no-cli-pager']
    if json_output:
        command += ['--output', 'json']
        return json.loads(subprocess.check_output(command, text=True))
    subprocess.run(command, check=True)


def check_subscription(subscription, distribution_arn, zone_arn, waf_arn):
    if subscription.get('status') != 'ACTIVE':
        raise ValueError('Pricing plan is not ACTIVE. No files were uploaded.')
    if subscription.get('planFamily') != 'CloudFront' or subscription.get('planTier') != 'FREE':
        raise ValueError('Expected the CloudFront FREE plan. No files were uploaded.')
    if subscription.get('scheduledChange'):
        raise ValueError('The plan has a pending change. Inspect it in AWS before publishing.')
    if not {distribution_arn, zone_arn, waf_arn}.issubset(subscription.get('resourceArns', [])):
        raise ValueError('The expected distribution, WAF and hosted zone must all be attached to the plan.')


def main():
    required = ['AWS_ACCOUNT_ID', 'SITE_BUCKET', 'DISTRIBUTION_ID', 'SUBSCRIPTION_ARN', 'HOSTED_ZONE_ARN']
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise ValueError('Missing repository variables: ' + ', '.join(missing))
    account, bucket, distribution, subscription_arn, zone_arn = [os.environ[k] for k in required]
    if not re.fullmatch(r'\d{12}', account) or bucket != 'bivops-site-' + account:
        raise ValueError('Unexpected account or site bucket name.')
    if not re.fullmatch(r'[A-Z0-9]+', distribution):
        raise ValueError('Invalid CloudFront distribution ID.')
    identity = aws('sts', 'get-caller-identity', json_output=True)
    if identity['Account'] != account:
        raise ValueError('AWS credentials belong to a different account.')
    detail = aws('cloudfront', 'get-distribution', '--id', distribution, json_output=True)['Distribution']
    distribution_arn = f'arn:aws:cloudfront::{account}:distribution/{distribution}'
    config = detail['DistributionConfig']
    if detail['ARN'] != distribution_arn or detail['Status'] != 'Deployed':
        raise ValueError('Expected a deployed distribution in this account.')
    if 'bivops.com' not in config['Aliases'].get('Items', []):
        raise ValueError('The distribution is not configured for bivops.com.')
    origins = config['Origins']['Items']
    if len(origins) != 1 or origins[0]['DomainName'] != f'{bucket}.s3.us-east-1.amazonaws.com':
        raise ValueError('The distribution does not use the expected site bucket.')
    subscription = aws('pricing-plan-manager', 'get-subscription', '--arn', subscription_arn, json_output=True)['subscription']
    check_subscription(subscription, distribution_arn, zone_arn, config['WebACLId'])
    print('Verified account, origin and active Free plan. Uploading site files.', flush=True)
    target = 's3://' + bucket
    # Upload dependencies first, then pages. No --delete: removing files is deliberate.
    aws('s3', 'sync', str(ROOT / 'dist'), target, '--exclude', '*.html', '--exclude', 'deploy.json',
        '--cache-control', 'public,max-age=300', '--only-show-errors')
    aws('s3', 'sync', str(ROOT / 'dist'), target, '--exclude', '*', '--include', '*.html',
        '--cache-control', 'no-cache,max-age=0,must-revalidate', '--only-show-errors')
    commit = os.environ.get('GITHUB_SHA') or subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json') as marker:
        json.dump({'commit': commit}, marker)
        marker.flush()
        aws('s3', 'cp', marker.name, target + '/deploy.json', '--content-type', 'application/json',
            '--cache-control', 'no-cache,max-age=0,must-revalidate', '--only-show-errors')
    invalidation = aws('cloudfront', 'create-invalidation', '--distribution-id', distribution,
                       '--paths', '/*', json_output=True)['Invalidation']['Id']
    aws('cloudfront', 'wait', 'invalidation-completed', '--distribution-id', distribution, '--id', invalidation)
    # Retry DNS/edge propagation, but do not report success if the live version differs.
    last_error = None
    for attempt in range(12):
        try:
            for path in ('/', '/skills.html', '/tools.html', '/learn.html', '/about.html', '/quiz.js', '/assets/ivan.png'):
                request = urllib.request.Request('https://bivops.com' + path, method='HEAD')
                with urllib.request.urlopen(request, timeout=15) as response:
                    if response.status != 200:
                        raise ValueError(f'{path} returned {response.status}')
            with urllib.request.urlopen('https://bivops.com/deploy.json', timeout=15) as response:
                if json.load(response).get('commit') != commit:
                    raise ValueError('The live commit does not match this deployment yet.')
            print('Verified https://bivops.com and deployed commit ' + commit)
            return
        except (OSError, ValueError) as error:
            last_error = error
            if attempt < 11:
                time.sleep(10)
    raise RuntimeError(f'Upload finished, but live verification failed: {last_error}')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
