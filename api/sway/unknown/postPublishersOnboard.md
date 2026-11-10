# Create a PayPal Partner Referrals session for a publisher (/api/sway/unknown/postPublishersOnboard)

`POST /api/publishers/onboard`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/publishers/onboard:
    post:
      summary: Create a PayPal Partner Referrals session for a publisher
      operationId: postPublishersOnboard
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                host:
                  type: string
                publisherEmail:
                  type: string
                  format: email
                returnUrl:
                  type: string
                  format: uri
              required:
                - host
      responses:
        "200":
          description: referral session
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
                  var response = await client.PostPublishersOnboard(
                      new PostPublishersOnboardRequest
                      {
                          Body = new ApiPublishersOnboardRequest
                          {
                              Host = "some example string",
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
                  response = client.post_publishers_onboard(
                      ApiPublishersOnboardRequest(
                          host="some example string"
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
                const response = await client.postPublishersOnboard({
                  body: { host: "some example string" },
                });
                // TODO: Handle 'response' of type Record<string, unknown>
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
info:
  title: Sway API
  version: 0.2.0
```