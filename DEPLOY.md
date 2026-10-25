# BIVOPS: GitHub и первый AWS-деплой

Подготовлено 25 октября 2026. AWS-ресурсы и GitHub-репозиторий этим пакетом ещё не созданы. Команды ниже выполняются из папки bivops в Bash на Linux/macOS или WSL.

## 1. Исправляем текст

Файл `dist/quiz.js`, строка 7. Она оставлена без изменений, как ты попросил. Нейтральная замена всей строки:

```js
return ['Keep learning at your own pace.','Every practice session is a chance to learn. Review the explanations and try again when you are ready.'];
```

## 2. Стоимость и обязательная проверка до apply

**Гарантировать итоговый AWS-счёт $0 нельзя.** Здесь нет постоянно работающих серверов, но есть тарифицируемые запросы S3.

| Часть | Стоимость и ограничения |
| --- | --- |
| Домен Porkbun | Отдельная ежегодная оплата по цене продления регистратора |
| CloudFront Free flat-rate plan | $0/месяц; allowances: 1 млн запросов и 100 ГБ передачи в месяц |
| Route 53 | Стандартные расходы зоны и DNS в пределах allowances покрываются, когда зона привязана к активному плану; Free допускает до 50 DNS-записей |
| S3 | Кредит на 5 ГБ S3 Standard storage не означает бесплатные GET/PUT/LIST-запросы. Они возникают при чтении сайта, деплоях и работе со state |
| WAF | Покрывается активным планом. До активации или после отмены может тарифицироваться отдельно |
| GitHub Actions | Стандартные hosted runners бесплатны для public-репозитория; у private есть квоты |

Для небольшого сайта и редких обновлений ожидаются очень небольшие расходы S3. Это оценка, не ограничение счёта. Другие эксперименты в аккаунте сюда не входят. Уже начисленные расходы Route 53 не считаем возвращаемыми. Без прикрепления зоны к плану её обычная цена начинается с $0.50/месяц плюс запросы.

**Перед созданием инфраструктуры открой CloudFront и проверь доступность именно Free flat-rate plan для своего аккаунта.** Документация AWS исключает аккаунты, использующие AWS Free Tier. AWS Free Tier и CloudFront Free plan - разные вещи. Не переключай тариф AWS-аккаунта только ради этой инструкции. Если план недоступен, сначала выбираем другой вариант и оцениваем стоимость.

Код закрепляет FREE и не переключает тариф автоматически. Но S3, WAF и CloudFront создаются до подписки. Если её создание завершится ошибкой, ранее созданные ресурсы останутся и могут тарифицироваться. После apply обязательно проверь ACTIVE/FREE и привязку своей зоны. После появления данных в Billing проверь фактические начисления. Можно настроить уведомление на $1; оно не останавливает ресурсы и не является жёстким лимитом.

Источники:

- https://aws.amazon.com/cloudfront/pricing/
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html
- https://aws.amazon.com/s3/pricing/
- https://aws.amazon.com/route53/pricing/
- https://docs.github.com/en/billing/concepts/product-billing/github-actions

## 3. Как устроена система

Браузер разрешает домен через существующую Route 53 зону и обращается по HTTPS к CloudFront. CloudFront читает файлы из закрытого S3 через Origin Access Control. HTTP перенаправляется на HTTPS. ACM выдаёт сертификат; DNS-запись подтверждения сохраняется для продления. WAF нужен для выбранного плана и ограничивает частоту запросов с одного IP.

Terraform создаёт эту инфраструктуру. GitHub Actions получает временные AWS credentials через OIDC и загружает только файлы сайта. CI не получает административную роль и не выполняет terraform apply. Постоянные AWS access keys в GitHub не нужны.

Второй закрытый S3-бакет хранит Terraform state, который связывает код с конкретными ресурсами AWS. Versioning помогает восстановить предыдущую версию state. S3 lockfile предотвращает параллельную запись. Bootstrap этого бакета имеет локальный state, его нужно хранить отдельно и защищённо.

Регион в коде us-east-1: сертификат CloudFront и WAF CLOUDFRONT должны быть там, S3 выбран там же для простоты. CloudFront и Route 53 глобальные. EC2, EKS, NAT Gateway, ALB, RDS и платный KMS-ключ не создаются.

## 4. Репозиторий

Достаточно личного public-репозитория **bivops-site**. Organization пока не нужна. При переносе в организацию потребуется обновить OWNER/REPO в OIDC trust.

Понадобятся Git, GitHub CLI, Terraform 1.17.0, AWS CLI v2 с pricing-plan-manager (в CI 2.37.7), Node 22 и Python 3.10+:

- https://cli.github.com/
- https://developer.hashicorp.com/terraform/install
- https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- https://nodejs.org/en/download

Распакуй архив, перейди в папку bivops, исправь строку квиза и проверь сайт:

```bash
cd bivops
python3 -m http.server 8080 --directory dist
```

Открой http://localhost:8080. Ctrl+C останавливает сервер. Далее:

```bash
gh auth login
gh auth status
git init -b main
git config user.name "YOUR_PUBLIC_NAME"
git config user.email "YOUR_GITHUB_NOREPLY_EMAIL"
git add .
git status --short
git diff --cached --stat
git commit -m "Add BIVOPS site and AWS deployment"
GH_OWNER=$(gh api user --jq .login)
gh repo create "$GH_OWNER/bivops-site" --public --source=. --remote=origin --push
```

При gh auth login выбери GitHub.com, HTTPS и вход через браузер. Замени два значения автора коммитов: можно использовать псевдоним и свой GitHub noreply email из Settings > Emails. Репозиторий, история и фото станут публичными. `.gitignore` исключает state, планы, credentials и локальные параметры, но всё равно просматривай git status. Ignore не удаляет секреты из существующей истории.

Первый push запустит проверки. Deploy будет skipped до настройки AWS_ROLE_ARN. Это нормально. В репозитории нет выбранной лицензии: публичная видимость сама по себе не даёт разрешения свободно переиспользовать код или фотографию.

## 5. Локальная авторизация AWS

Используй отдельную рабочую IAM identity/роль, не root. Если есть настроенный profile, используй его. Для IAM Identity Center: `aws configure sso`, затем `aws sso login --profile bivops`.

Для обычного входа через Console можно использовать aws login. IAM identity нужен SignInLocalDevelopmentAccess. Это только разрешение на вход, а не права создания инфраструктуры:

```bash
aws login --profile bivops-login --region us-east-1
aws configure set credential_process 'aws configure export-credentials --profile bivops-login --format process' --profile bivops
aws configure set region us-east-1 --profile bivops
export AWS_PROFILE=bivops
export AWS_REGION=us-east-1
aws sts get-caller-identity
```

Credential process позволяет Terraform получать временные credentials через CLI без ручного копирования ключей. Для уже работающего SSO/profile дополнительная настройка не нужна. `get-caller-identity` ничего не создаёт: проверь Account и Arn.

Identity для первичного apply нужны права на S3, IAM OIDC/роль, ACM, WAF, CloudFront, записи выбранной DNS-зоны и Pricing Plan Manager. Ограничения организации/SCP тоже учитываются. При AccessDenied разбирай конкретное недостающее разрешение. Не выдавай GitHub роль администратора. Ограниченные права CI описаны в infra/iam.tf.

Справка: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html

## 6. Проверяем DNS и существующий OIDC provider

```bash
aws route53 list-hosted-zones-by-name --dns-name bivops.com
aws route53 get-hosted-zone --id Z_REPLACE_WITH_REAL_ID
aws route53 list-resource-record-sets --hosted-zone-id Z_REPLACE_WITH_REAL_ID
aws iam list-open-id-connect-providers
```

Замени ID в командах на ID существующей публичной зоны bivops.com без префикса /hostedzone/. Сравни её NS с установленными у Porkbun. Вторую зону не создавай, NS менять не нужно. Terraform не удаляет существующие NS/SOA/TXT и будущие MX.

Если A/AAAA корня домена уже существуют, сначала выясни их назначение. Код не перезаписывает конфликтующие записи автоматически. Если IAM provider token.actions.githubusercontent.com уже существует, укажи его ARN в tfvars. Он должен иметь audience sts.amazonaws.com; не удаляй провайдер других проектов.

## 7. Создаём бакет Terraform state

```bash
terraform -chdir=bootstrap init
terraform -chdir=bootstrap plan -out=bootstrap.tfplan
terraform -chdir=bootstrap show bootstrap.tfplan
```

Init устанавливает закреплённый provider. Plan только рассчитывает изменения. Здесь должны быть бакет state и его настройки: публичный доступ закрыт, SSE-S3, versioning. Проверь аккаунт и имя, затем:

```bash
terraform -chdir=bootstrap apply bootstrap.tfplan
terraform -chdir=bootstrap output
```

Apply выполняет сохранённый план без повторного вопроса. Сначала просмотри его. Сохрани bootstrap/terraform.tfstate и backup вне Git в защищённом месте; обновляй копию после изменений bootstrap. Если такое имя бакета уже занято, проверь владельца. Существующий свой ресурс можно импортировать, а не создавать дубликат.

## 8. Настраиваем Terraform для сайта

```bash
STATE_BUCKET=$(terraform -chdir=bootstrap output -raw state_bucket)
cat > infra/backend.hcl <<EOF
bucket       = "$STATE_BUCKET"
key          = "bivops-site/terraform.tfstate"
region       = "us-east-1"
encrypt      = true
use_lockfile = true
EOF
cp infra/terraform.tfvars.example infra/terraform.tfvars
```

Открой infra/terraform.tfvars и укажи hosted_zone_id, точный github_repository в формате OWNER/bivops-site с правильным регистром и существующий OIDC ARN, если есть. Установи `free_plan_eligibility_confirmed = true` только после проверки доступности Free plan из раздела 2.

```bash
terraform -chdir=infra init -backend-config=backend.hcl
terraform -chdir=infra validate
terraform -chdir=infra plan -out=site.tfplan
terraform -chdir=infra show site.tfplan
```

Ожидаем приватный S3, ACM и CNAME подтверждения, CloudFront, один WAF ACL, подписку FREE, роль GitHub и A/AAAA в существующей зоне. Не должно быть новой hosted zone, серверов, NAT, базы, платного pricing tier или удаления чужих ресурсов.

Если существующие A/AAAA уже принадлежат этому сайту и ты осознанно передаёшь их Terraform, импортируй только реально существующие записи. Формат с примером ID:

```bash
terraform -chdir=infra import 'aws_route53_record.site["A"]' Z_REAL_ID_bivops.com_A
terraform -chdir=infra import 'aws_route53_record.site["AAAA"]' Z_REAL_ID_bivops.com_AAAA
```

После импорта повтори plan. Когда план проверен:

```bash
terraform -chdir=infra apply site.tfplan
terraform -chdir=infra output
```

ACM/DNS/CloudFront могут настраиваться десятки минут. При истечении login обнови сессию и сначала получи новый plan. До загрузки файлов сайт может отвечать 403: index.html ещё нет. Успешный apply должен показать subscription_status ACTIVE. В Console проверь Free и привязанные distribution, WAF, hosted zone. При ошибке подписки не продолжай публикацию, см. раздел 12.

## 9. Настраиваем CI/CD и запускаем первый деплой

```bash
python3 scripts/configure_github.py
gh variable list
gh workflow run site.yml --ref main
gh run list --workflow site.yml --limit 5
gh run watch RUN_ID --exit-status
```

В последней команде подставь ID только что запущенного workflow из списка. Скрипт configure_github читает Terraform outputs и задаёт repository variables: AWS_ACCOUNT_ID, AWS_ROLE_ARN, SITE_BUCKET, DISTRIBUTION_ID, SUBSCRIPTION_ARN, HOSTED_ZONE_ARN. Это идентификаторы, не секретные ключи.

Workflow проверяет сайт и Terraform, получает короткоживущие credentials через OIDC, сверяет аккаунт/бакет/Free plan/зону, загружает файлы dist, сбрасывает кеш и проверяет опубликованные HTTPS-страницы. deploy.json содержит SHA опубликованного коммита.

Только main может получить роль. PR проверяются без AWS credentials. Не добавляй GitHub Environment к deploy-job без изменения IAM trust: environment меняет OIDC subject. Публикации сериализованы и не прерывают друг друга. Зависимости загружаются перед HTML; обновление нескольких файлов не атомарно.

Автоматического удаления объектов нет. Удалённая из dist страница остаётся в S3 до отдельного осознанного удаления и invalidation. Роль CI не умеет удалять объекты. Это важно, если снимаешь с публикации страницу.

## 10. Проверяем вручную

```bash
dig @1.1.1.1 bivops.com A +short
dig @1.1.1.1 bivops.com AAAA +short
curl -I http://bivops.com
curl -I https://bivops.com
curl -fsS https://bivops.com/deploy.json
git rev-parse HEAD
SITE_BUCKET=$(terraform -chdir=infra output -raw site_bucket)
curl -I "https://${SITE_BUCKET}.s3.us-east-1.amazonaws.com/index.html"
terraform -chdir=infra plan
```

Ожидаем DNS-адреса CloudFront, HTTP redirect на HTTPS, HTTPS 200, SHA в deploy.json совпадает с опубликованным коммитом. Прямой неподписанный запрос к S3 должен получить 403. Terraform plan после apply без внешних правок должен показывать отсутствие изменений инфраструктуры.

В браузере открой все пять страниц, пройди квиз, проверь объяснения/Restart и утилиты. Проверь мобильный вид. HTTP 200 не доказывает нулевой счёт: отдельно смотри Billing после обновления данных и детали CloudFront plan.

## 11. Обновления и откат

```bash
git switch -c update-quiz-copy
# Измени нужный файл в редакторе.
node --test tests/site.test.js
python3 scripts/check_site.py
git add dist/quiz.js
git commit -m "Use neutral quiz feedback"
git push -u origin update-quiz-copy
gh pr create --base main --fill
```

Посмотри diff и зелёные checks, затем объедини PR через GitHub. Push в main публикует сайт. Рекомендуется защитить main и требовать validate; для личного проекта не нужно обязательное одобрение второго человека.

Инфраструктуру меняй через локальный plan/apply с просмотром, затем коммит кода. CI не применяет Terraform. При изменении outputs повтори configure_github.py. Закреплённые .terraform.lock.hcl нужно коммитить, их нельзя заменять ручным удалением checksums.

Откат обычного коммита сайта: git revert BAD_COMMIT_SHA на актуальной main и push. Merge-коммит требует осознанного выбора parent. Git revert Terraform-кода сам по себе не меняет AWS: нужен новый plan/apply.

## 12. Ошибки и закрытие проекта

| Ошибка | Проверка |
| --- | --- |
| Deploy skipped | main, не PR, задан AWS_ROLE_ARN |
| OIDC AccessDenied | OWNER/REPO/main в trust, audience, отсутствие неожиданного environment |
| Unknown pricing-plan-manager | Обновить AWS CLI |
| 403 от домена | index.html в S3, origin/OAC/bucket policy, затем invalidation |
| ACM Pending validation | CNAME в делегированной публичной зоне, правильные NS |
| Subscription ValidationException | Eligibility аккаунта, квота Free plans, совместимость/привязки ресурсов |
| Terraform checksum mismatch | Переустановить provider из официального registry с сохранением lockfile, не отключать проверки целостности |

Если apply упал, Terraform не удаляет уже созданные ресурсы автоматически. Посмотри `terraform -chdir=infra state list`, консоль и ошибку. Для исправимой причины получи новый plan и повтори apply. Пока Free plan не ACTIVE, WAF/CloudFront/DNS могут тарифицироваться отдельно. Не оставляй частичный деплой без решения.

Для закрытия проекта сначала отключи deploy-workflow и сохрани нужные файлы/state. Подписка и бакеты защищены prevent_destroy, обычный destroy будет заблокирован. Полное удаление требует осознанно снять защиту, отменить Free subscription и удалить выделенные сайту CloudFront/WAF/ACM/DNS-записи. После отмены подписки оставшиеся ресурсы переходят на обычную тарификацию, поэтому отмена - часть процедуры удаления, а не способ оставить WAF бесплатно.

Versioned S3-бакет требует удаления всех версий и delete markers после резервного копирования. Existing hosted zone используется через data source и не удаляется вместе с сайтом. Porkbun-домен тоже остаётся. Не удаляй общий OIDC/state bucket, если их используют другие проекты. Один универсальный destroy-скрипт здесь не предоставлен: безопасный план зависит от реально созданных и общих ресурсов.

## 13. Границы проверки

Локально прошли тесты утилит/квиза, ссылок, структуры файлов, отказа публикации при неправильной подписке и terraform fmt. YAML workflow разобран и проверен. Полную terraform validate здесь завершить не удалось: среда запрещает Unix-сокет, который provider использует для связи с Terraform (socket: operation not permitted). Поэтому проверка схемы ресурсов остаётся обязательным следующим шагом локально и в CI. Live AWS plan/apply, GitHub OIDC и публикация требуют твоего аккаунта и ещё не выполнялись.

Контактный адрес пока не добавлен: перед публикацией укажи реальный канал связи в dist/about.html. Не публикуй придуманный mailbox, пока он не принимает письма.
