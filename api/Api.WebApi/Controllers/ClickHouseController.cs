using Api.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace Api.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClickHouseController : ControllerBase
{
    private readonly IClickHouseService _clickHouseService;
    private readonly ILogger<ClickHouseController> _logger;

    public ClickHouseController(
        IClickHouseService clickHouseService,
        ILogger<ClickHouseController> logger)
    {
        _clickHouseService = clickHouseService;
        _logger = logger;
    }

    /// <summary>
    /// Prueba la conexión a ClickHouse
    /// </summary>
    [HttpGet("test-connection")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            var isConnected = await _clickHouseService.TestConnectionAsync();
            
            if (isConnected)
            {
                return Ok(new { success = true, message = "ClickHouse connection successful" });
            }
            
            return StatusCode(500, new { success = false, message = "Failed to connect to ClickHouse" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing ClickHouse connection");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene información de la base de datos
    /// </summary>
    [HttpGet("database-info")]
    public async Task<IActionResult> GetDatabaseInfo()
    {
        try
        {
            var versionQuery = "SELECT version()";
            var version = await _clickHouseService.ExecuteScalarAsync<string>(versionQuery);

            var databasesQuery = "SHOW DATABASES";
            var databases = await _clickHouseService.ExecuteQueryAsync(databasesQuery);

            return Ok(new 
            { 
                version = version,
                databases = databases.Rows.Cast<DataRow>()
                    .Select(row => row[0].ToString())
                    .ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database info");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene las tablas disponibles en ClickHouse
    /// </summary>
    [HttpGet("tables")]
    public async Task<IActionResult> GetTables([FromQuery] string database = "default")
    {
        try
        {
            var query = $"SHOW TABLES FROM {database}";
            var tables = await _clickHouseService.ExecuteQueryAsync(query);

            var tableList = tables.Rows.Cast<DataRow>()
                .Select(row => row[0].ToString())
                .ToList();

            return Ok(new { database = database, tables = tableList });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tables from ClickHouse");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Ejecuta una consulta personalizada (solo para desarrollo)
    /// </summary>
    [HttpPost("query")]
    public async Task<IActionResult> ExecuteQuery([FromBody] QueryRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest(new { success = false, message = "Query cannot be empty" });
            }

            // Validar que solo sea una query de lectura (SELECT)
            var trimmedQuery = request.Query.Trim().ToUpper();
            if (!trimmedQuery.StartsWith("SELECT") && !trimmedQuery.StartsWith("SHOW") && !trimmedQuery.StartsWith("DESCRIBE"))
            {
                return BadRequest(new { success = false, message = "Only SELECT, SHOW, and DESCRIBE queries are allowed" });
            }

            var result = await _clickHouseService.ExecuteQueryAsync(request.Query);
            
            // Convertir DataTable a formato JSON amigable
            var rows = new List<Dictionary<string, object>>();
            foreach (System.Data.DataRow row in result.Rows)
            {
                var dict = new Dictionary<string, object>();
                foreach (System.Data.DataColumn col in result.Columns)
                {
                    dict[col.ColumnName] = row[col];
                }
                rows.Add(dict);
            }

            return Ok(new 
            { 
                success = true,
                rowCount = result.Rows.Count,
                columns = result.Columns.Cast<System.Data.DataColumn>().Select(c => c.ColumnName).ToList(),
                data = rows
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing query");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

public class QueryRequest
{
    public string Query { get; set; } = string.Empty;
}
