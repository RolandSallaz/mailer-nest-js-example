# 📬 Mailer NestJS Example

Минимальный сервис отправки email на **NestJS** с:

* валидацией DTO
* retry логикой
* конфигом через `@nestjs/config`
* unit + e2e тестами (через Ethereal SMTP)

# 🧠 Архитектура

```text
HTTP → Controller → Service → MailerService → SMTP
```

### Поток запроса:

1. Клиент отправляет POST `/mail/send`
2. MailService отправляет письмо
3. При ошибке — retry
4. При успехе → 204 No Content

---

# 📦 Установка

```bash
npm install
```

---

# ⚙️ ENV конфиг

`.env`:

```env
MAIL_HOST=smtp.yandex.ru
MAIL_PORT=465
MAIL_USER=your_email@yandex.ru
MAIL_PASSWORD=your_app_password
```

---

# ▶️ Запуск

```bash
npm run start:dev
```

---

# 📮 API

## POST /mail/send

### Request

```json
{
  "to": "test@mail.com",
  "subject": "Hello",
  "text": "Test message"
}
```

или

```json
{
  "to": "test@mail.com",
  "subject": "Hello",
  "html": "<b>Test</b>"
}
```

---

### Response

```
204 No Content
```

---

# ❗ Валидация

* `to` — обязательный email
* `subject` — обязательная строка
* должен быть **хотя бы один** из:

  * `text`
  * `html`

---

# 🔁 Retry логика

Конфиг:

```ts
retry: {
  maxRetries: 2,
  delayMs: 1000
}
```

Поведение:

* при ошибке SMTP → повторная попытка
* после исчерпания → ошибка

---

# 🧪 Тесты

## Unit

```bash
npm run test
```

Покрывает:

* retry
* ошибки
* payload

---

## E2E

```bash
npm run test:e2e
```

Использует:

* Nodemailer test account (Ethereal)
* реальную отправку email

После теста:

```text
📨 Preview URL: https://ethereal.email/message/...
```

---

# ⚠️ Ограничения E2E

* требует интернет

# 🛠️ Стек

* NestJS
* @nestjs-modules/mailer
* nodemailer
* class-validator
* Jest + Supertest
