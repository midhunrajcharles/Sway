# Pay the publisher that causally decided an honest buy (/api/sway/unknown/postPayoutsCredit)

`POST /api/payouts/credit`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/payouts/credit:
    post:
      summary: Pay the publisher that causally decided an honest buy
      operationId: postPayoutsCredit
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                orderId:
                  type: string
              required:
                - orderId
      responses:
        "200":
          description: payout result
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
                  var response = await client.PostPayoutsCredit(
                      new PostPayoutsCreditRequest
                      {
                          Body = new ApiPayoutsCreditRequest
                          {
                              OrderId = "some example string",
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
                  response = client.post_payouts_credit(
                      ApiPayoutsCreditRequest(
                          order_id="some example string"
                      ),
                  )
                  # TODO: Handle 'response' of type Any
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.postPayoutsCredit({
                  body: { orderId: "some example string" },
                });
                // TODO: Handle 'response' of type Record<string, unknown>
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
info:
  title: Sway API
  version: 0.2.0
```