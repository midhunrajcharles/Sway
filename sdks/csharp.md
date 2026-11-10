# C# SDK (/sdks/csharp)

[Download SDK](/__downloads/sdk/csharp.zip)

## Intro [#intro]

The Sway API SDK provides access to the Sway API REST APIs.

Sway runs the agent's shopping decision with each page it read ablated, scores each page's causal weight, and asks a second key — the Channel3 catalog — whether the deciding page tells the truth. The result is a pre-capture verdict ('allow' or 'block') and, when honest, a Payout destination.

## Installation [#installation]

Add the SDK as a project reference into your solution:

```bash
dotnet add reference <path-to-sdk>/src/SwayApi/SwayApi.csproj
```

The project takes its build settings from the files around it, so reference it in place.

## Quick Start [#quick-start]

### Dependency Injection [#dependency-injection]

Register the client with `IServiceCollection` and resolve it from the container. The `HttpClient` is managed by `IHttpClientFactory`. Configure the client's behavior through `SwayApiClientOptions`.

```csharp
services.AddSwayApiClient(options =>
{
    options.Environment = ServerEnvironment.Production;
    // TODO: configure more client options here
});
```

### Direct Instantiation [#direct-instantiation]

Create the client by passing an `HttpClient` you manage yourself. Configure the client's behavior through `SwayApiClientOptions`.

```csharp
var httpClient = new HttpClient();
// TODO: configure more client options here
var options = new SwayApiClientOptions { Environment = ServerEnvironment.Production };
var client = new SwayApiClient(httpClient, options);
```