# PayPal webhook ingest (signature-verified, idempotent by event id) (/api/sway/unknown/postWebhooksPaypal)

`POST /api/webhooks/paypal`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/webhooks/paypal:
    post:
      summary: PayPal webhook ingest (signature-verified, idempotent by event id)
      operationId: postWebhooksPaypal
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        "200":
          description: received
          content:
            application/json:
              schema:
                type: object
        "401":
          description: signature verification failed
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.PostWebhooksPaypal(
                      new PostWebhooksPaypalRequest { Body = body });
                  // TODO: Handle 'response' of type object
              }
              catch (ApiException<PostWebhooksPaypalError> ex)
              {
                  if (ex.Error.TryGetNoContent(out var error))
                  {
                      // TODO: Handle 'error' of type RawError
                  }
              }
        - lang: python
          label: Python
          sources:
            Example: |-
              try:
                  response = client.post_webhooks_paypal({})
                  # TODO: Handle 'response' of type Any
              except ApiError as e:
                  # TODO: Handle 'e.error' of type
                  # PostWebhooksPaypalErrorBody
                  ...
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.postWebhooksPaypal({
                  body: {},
                });
                // TODO: Handle 'response' of type Record<string, unknown>
              } catch (err) {
                // TODO: Handle 'err' of type SwayApiClient.PostWebhooksPaypalError, discriminated with 'err.payload.kind'
              }
info:
  title: Sway API
  version: 0.2.0
```