# Service health (/api/sway/unknown/getHealth)

`GET /api/health`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/health:
    get:
      summary: Service health
      operationId: getHealth
      responses:
        "200":
          description: ok
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Health"
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.GetHealth();
                  // TODO: Handle 'response' of type Health
              }
              catch (ApiException<RawError> ex)
              {
                  // TODO: Handle 'ex.Error' of type RawError
              }
        - lang: python
          label: Python
          sources:
            Example: |-
              try:
                  response = client.get_health()
                  # TODO: Handle 'response' of type Health
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.getHealth();
                // TODO: Handle 'response' of type Health
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
components:
  schemas:
    Health:
      type: object
      properties:
        ok:
          type: boolean
        backend:
          type: string
        model:
          type: string
        k:
          type: integer
      required:
        - ok
info:
  title: Sway API
  version: 0.2.0
```