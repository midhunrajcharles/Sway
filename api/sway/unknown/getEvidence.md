# Headline numbers for the /evidence page (/api/sway/unknown/getEvidence)

`GET /api/evidence`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/evidence:
    get:
      summary: Headline numbers for the /evidence page
      operationId: getEvidence
      responses:
        "200":
          description: evidence payload
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Evidence"
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.GetEvidence();
                  // TODO: Handle 'response' of type Evidence
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
                  response = client.get_evidence()
                  # TODO: Handle 'response' of type Evidence
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.getEvidence();
                // TODO: Handle 'response' of type Evidence
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
components:
  schemas:
    Evidence:
      type: object
      properties:
        main_run:
          type: string
        main:
          type: array
          items:
            type: object
        subtle:
          type: array
          items:
            type: object
        model:
          type: string
        k:
          type: integer
info:
  title: Sway API
  version: 0.2.0
```