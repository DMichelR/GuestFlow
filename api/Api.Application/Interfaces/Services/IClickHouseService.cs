using System.Data;

namespace Api.Application.Interfaces.Services;

public interface IClickHouseService
{
    /// <summary>
    /// Ejecuta una consulta de lectura en ClickHouse y retorna los resultados
    /// </summary>
    Task<DataTable> ExecuteQueryAsync(string query, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Ejecuta una consulta de lectura con parámetros en ClickHouse y retorna los resultados
    /// </summary>
    Task<DataTable> ExecuteQueryAsync(string query, Dictionary<string, object> parameters, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Ejecuta un comando en ClickHouse (INSERT, UPDATE, DELETE, CREATE, etc.)
    /// </summary>
    Task<int> ExecuteNonQueryAsync(string command, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Ejecuta un comando con parámetros en ClickHouse
    /// </summary>
    Task<int> ExecuteNonQueryAsync(string command, Dictionary<string, object> parameters, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Ejecuta una consulta y retorna un solo valor escalar
    /// </summary>
    Task<T?> ExecuteScalarAsync<T>(string query, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Ejecuta una consulta con parámetros y retorna un solo valor escalar
    /// </summary>
    Task<T?> ExecuteScalarAsync<T>(string query, Dictionary<string, object> parameters, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Verifica si la conexión a ClickHouse está disponible
    /// </summary>
    Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default);
}
