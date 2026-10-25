# BIVOPS

A static, English-language website with a warm light theme.
The design is approved. This package includes Terraform and GitHub Actions.
Nothing has been deployed to AWS and no GitHub repository has been created yet.
Read [DEPLOY.md](DEPLOY.md) for the Russian deployment tutorial, costs and checks.

## Preview
Extract the entire archive and open dist/index.html.
Keep the file structure intact.
Optional local server: python3 -m http.server 8080 --directory dist
Open http://localhost:8080.

## Pages
- Home: a concise introduction and entry points to the quiz, tools, and learning links.
- Skill check: 8 multiple-choice questions with hints, per-answer explanations, official documentation links, score, encouraging feedback, review, and restart.
- Tools: JSON formatting, UTF-8 Base64, and IPv4 CIDR calculations.
- Learn: Udemy, AWS Skill Builder, Microsoft Learn, Go, and selected official documentation.
- About: Ivan's photograph, engineering interests, grouped toolkit, and free community-help offer.

Notes and its reference-design disclaimers were removed.
No implementation or review instructions are shown in public pages.
All long dashes in HTML, CSS, and JavaScript were replaced with short hyphens.
The original portrait is displayed using a circular CSS frame.

## Content
The quiz is a learning exercise, not a professional certification.
Questions cover Kubernetes readiness, Terraform plan, Vault leases, Helm templates,
Argo CD self-healing, Ansible check mode, Go goroutines, and Kubernetes operators.
Each answer explanation links directly to the associated official documentation.
External resources were checked on 2026-10-25. Review external content periodically as pages can change.
No affiliate links, political content, or fundraising appeals are included in the website.
All links are limited to the selected learning platforms and technical documentation.
No third-party repository recommendation list remains.
The About toolkit describes areas of work and interest, not a claim of expert proficiency in every listed tool.
Ivan has not supplied a public contact yet. The page includes the invitation but no invented address or public setup placeholder.

## Editing
dist/*.html - pages
dist/style.css - shared appearance
dist/app.js - browser utilities
dist/questions.js - quiz content and source links
dist/quiz.js - quiz interaction and scoring
No build step, package dependencies, analytics, or runtime API requests.
Quiz answers and tool inputs are not saved or transmitted.

## Verified
- Five English pages and working local links/anchors.
- No en/em dashes or Russian interface strings in site source.
- Quiz data structure and all four score-message boundaries.
- Full browser rounds yielding 7/8 and 0/8.
- Retry resets the question index and progress.
- Desktop appearance and 390px responsive layouts for Home, About, and Skills.
- Utility syntax and representative Base64/CIDR checks.
- Documentation links and platform destinations verified against primary sources.

## Limitations
JSON.parse can round large numbers; the interface states this.
CIDR uses general IPv4 host rules, not AWS-specific reservations.
Clipboard access depends on the browser and page security context.
The original photograph is about 2.8 MB. Asset optimization can be added before deployment.

## Deployment source
- bootstrap/: private versioned S3 bucket for Terraform state.
- infra/: private S3 origin, CloudFront, ACM, WAF, Free flat-rate subscription, existing Route 53 zone and GitHub OIDC role.
- .github/workflows/site.yml: pull request validation and publication from main.
- scripts/: offline checks, deployment guard and GitHub variable setup.
- tests/: meaningful utility, quiz and pricing-plan guard tests.

Only dist/ is published. No AWS credentials belong in Git. Commit both .terraform.lock.hcl files. Infrastructure applies run locally after reviewing a plan; CI only publishes content.

## Local checks
Run node --test tests/site.test.js, python3 scripts/check_site.py and python3 -m unittest discover -s tests. Terraform uses version 1.17.0 and AWS provider 6.70.0.

No reuse license has been selected yet. Public visibility alone is not a free-software license, and the portrait is not licensed for reuse by this package.
