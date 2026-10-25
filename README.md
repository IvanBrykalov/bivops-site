# BIVOPS

A static, English-language website with a warm light theme.
The design is approved. This package includes Terraform and GitHub Actions.
Infrastructure is deployed separately from publishing this repository.
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
A 256 x 256 avatar (dist/assets/me.png) is displayed using a circular CSS frame.

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
Only the small avatar belongs in the website source. Keep the full-size portrait outside Git.

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

## Browser security
Each HTML page declares a Content Security Policy immediately after the charset meta element, before any script or stylesheet. Scripts, styles and images load only from this site. Inline scripts, network API requests and form submissions are blocked. External documentation links still work.

CloudFront uses the managed SecurityHeadersPolicy, which is supported by the Free flat-rate plan. This provides HSTS, nosniff, referrer policy and X-Frame-Options: SAMEORIGIN. Custom response headers policies require Business or Premium under flat-rate pricing, so this project does not create one.

The CSP takes effect when the HTML is loaded, including local previews. A meta CSP cannot enforce frame-ancestors; cross-origin framing protection comes from the CloudFront X-Frame-Options response header after deployment. The CSP will not appear in curl -I output; inspect the HTML or browser DOM instead.

Adding a third-party script, remote image, form or API requires an explicit policy review. CSP does not protect against an attacker who can replace trusted site files. The offline site check verifies the policy and its position on every page.
