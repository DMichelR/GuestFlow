FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["Api.WebApi/Api.WebApi.csproj", "Api.WebApi/"]
COPY ["Api.Infrastructure/Api.Infrastructure.csproj", "Api.Infrastructure/"]
COPY ["Api.Application/Api.Application.csproj", "Api.Application/"]
COPY ["Api.Domain/Api.Domain.csproj", "Api.Domain/"]
RUN dotnet restore "Api.WebApi/Api.WebApi.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR "/src/Api.WebApi"

# Build and publish the application
RUN dotnet build "Api.WebApi.csproj" -c Release -o /app/build
RUN dotnet publish "Api.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Create a non-root user
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Copy the published application
COPY --from=build /app/publish .

EXPOSE 8000
ENV ASPNETCORE_URLS=http://+:8000

ENTRYPOINT ["dotnet", "Api.WebApi.dll"]