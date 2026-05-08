using System.Data;
using Api.Application.Interfaces.Services;
using ClickHouse.Client.ADO;
using ClickHouse.Client.Utility;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Services.Domain;

public class ClickHouseService : IClickHouseService
{
    private readonly string _connectionString;
    private readonly ILogger<ClickHouseService> _logger;

    public ClickHouseService(IConfiguration configuration, ILogger<ClickHouseService> logger)
    {
        _connectionString = configuration.GetConnectionString("ClickHouse") 
            ?? throw new InvalidOperationException("ClickHouse connection string not configured");
        _logger = logger;
    }

    public async Task<DataTable> ExecuteQueryAsync(string query, CancellationToken cancellationToken = default)
    {
        return await ExecuteQueryAsync(query, new Dictionary<string, object>(), cancellationToken);
    }

    public async Task<DataTable> ExecuteQueryAsync(string query, Dictionary<string, object> parameters, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new ClickHouseConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = query;

            foreach (var parameter in parameters)
            {
                command.AddParameter(parameter.Key, parameter.Value);
            }

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var dataTable = new DataTable();
            dataTable.Load(reader);

            _logger.LogInformation("Query executed successfully: {Query}", query);
            return dataTable;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing query: {Query}", query);
            throw;
        }
    }

    public async Task<int> ExecuteNonQueryAsync(string command, CancellationToken cancellationToken = default)
    {
        return await ExecuteNonQueryAsync(command, new Dictionary<string, object>(), cancellationToken);
    }

    public async Task<int> ExecuteNonQueryAsync(string command, Dictionary<string, object> parameters, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new ClickHouseConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = command;

            foreach (var parameter in parameters)
            {
                cmd.AddParameter(parameter.Key, parameter.Value);
            }

            var result = await cmd.ExecuteNonQueryAsync(cancellationToken);
            
            _logger.LogInformation("Command executed successfully: {Command}", command);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing command: {Command}", command);
            throw;
        }
    }

    public async Task<T?> ExecuteScalarAsync<T>(string query, CancellationToken cancellationToken = default)
    {
        return await ExecuteScalarAsync<T>(query, new Dictionary<string, object>(), cancellationToken);
    }

    public async Task<T?> ExecuteScalarAsync<T>(string query, Dictionary<string, object> parameters, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new ClickHouseConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = query;

            foreach (var parameter in parameters)
            {
                command.AddParameter(parameter.Key, parameter.Value);
            }

            var result = await command.ExecuteScalarAsync(cancellationToken);
            
            _logger.LogInformation("Scalar query executed successfully: {Query}", query);
            
            if (result == null || result == DBNull.Value)
                return default;

            return (T)Convert.ChangeType(result, typeof(T));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing scalar query: {Query}", query);
            throw;
        }
    }

    public async Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new ClickHouseConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1";
            var result = await command.ExecuteScalarAsync(cancellationToken);

            _logger.LogInformation("ClickHouse connection test successful");
            return result != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ClickHouse connection test failed");
            return false;
        }
    }
}
