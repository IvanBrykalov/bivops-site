#!/usr/bin/env python3
"""Copy non-secret Terraform outputs to GitHub repository variables."""
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
outputs = json.loads(subprocess.check_output(['terraform', '-chdir=infra', 'output', '-json'], cwd=root, text=True))
repository = outputs['github_repository']['value']
mapping = {
    'AWS_ACCOUNT_ID': 'account_id', 'AWS_ROLE_ARN': 'deploy_role_arn',
    'SITE_BUCKET': 'site_bucket', 'DISTRIBUTION_ID': 'distribution_id',
    'SUBSCRIPTION_ARN': 'subscription_arn', 'HOSTED_ZONE_ARN': 'hosted_zone_arn',
}
for name, output in mapping.items():
    subprocess.run(['gh', 'variable', 'set', name, '--repo', repository, '--body', outputs[output]['value']], check=True)
    print('Set ' + name + ' in ' + repository)
