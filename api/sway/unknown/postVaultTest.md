# Sandbox probe: AUTHORIZE + payment_source.paypal.vault_id (/api/sway/unknown/postVaultTest)

`POST /api/vault/test`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/vault/test:
    post:
      summary: "Sandbox probe: AUTHORIZE + payment_source.paypal.vault_id"
      operationId: postVaultTest
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                vaultId:
                  type: string
                amount:
                  type: number
              required:
                - vaultId
      responses:
        "200":
          description: probe result
          content:
            application/json:
              schema:
                type: object
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.PostVaultTest(
                      new PostVaultTestRequest
                      {
                          Body = new ApiVaultTestRequest
                          {
                              VaultId = "some example string",
                          },
                      });
                  // TODO: Handle 'response' of type object
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
                  response = client.post_vault_test(
                      ApiVaultTestRequest(vault_id="some example string")
                  )
                  # TODO: Handle 'response' of type Any
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.postVaultTest({
                  body: { vaultId: "some example string" },
                });
                // TODO: Handle 'response' of type Record<string, unknown>
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
info:
  title: Sway API
  version: 0.2.0
```