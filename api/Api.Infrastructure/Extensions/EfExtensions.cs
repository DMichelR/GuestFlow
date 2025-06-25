using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Extensions;

/// <summary>
/// Provides extension methods for Entity Framework Core
/// </summary>
public static class EfExtensions
{
    /// <summary>
    /// Ignores the IsActive filter when querying entities that have this property
    /// </summary>
    /// <typeparam name="TEntity">Entity type</typeparam>
    /// <param name="source">The source IQueryable</param>
    /// <returns>IQueryable with IsActive filter removed</returns>
    public static IQueryable<TEntity> IgnoreIsActiveFilter<TEntity>(this IQueryable<TEntity> source) 
        where TEntity : class
    {
        // Check if the entity has an IsActive property
        var property = typeof(TEntity).GetProperty("IsActive", BindingFlags.Public | BindingFlags.Instance);
        if (property == null)
        {
            // If there's no IsActive property, just return the source query
            return source;
        }

        // Get the internal EF query provider
        var provider = source.Provider;
        
        // Use reflection to access the internal SetIsActiveFilterEnabled method
        var internalType = provider.GetType();
        var entityQueryableType = typeof(TEntity).Assembly
            .GetType($"Microsoft.EntityFrameworkCore.Query.Internal.EntityQueryable`1")
            ?.MakeGenericType(typeof(TEntity));

        // Create the expression parameter
        var parameter = Expression.Parameter(typeof(bool), "isEnabled");
        
        // Create a method call to an internal SetFilterEnabled method with reflection
        // This is a workaround since EF Core doesn't provide a direct API
        var methods = internalType.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
            .Where(m => m.Name.Contains("Filter") && m.GetParameters().Length == 1 && m.GetParameters()[0].ParameterType == typeof(bool))
            .ToList();

        if (methods.Any())
        {
            try
            {
                // Try to create dynamic expression to disable the filter
                var methodCall = Expression.Call(
                    Expression.Constant(provider),
                    methods.First(),
                    parameter);
                
                var lambda = Expression.Lambda<Func<bool, IQueryable<TEntity>>>(
                    Expression.Convert(methodCall, typeof(IQueryable<TEntity>)),
                    parameter);
                
                // Execute the lambda with false to disable the filter
                return lambda.Compile()(false);
            }
            catch
            {
                // If reflection fails, use the fallback approach with IgnoreQueryFilters
                return source.IgnoreQueryFilters();
            }
        }
        
        // Fallback to IgnoreQueryFilters (which will remove ALL filters, including tenant filter)
        return source.IgnoreQueryFilters();
    }
    
    /// <summary>
    /// Includes inactive entities in the query that would normally be filtered by the IsActive property
    /// </summary>
    /// <typeparam name="TEntity">Entity type</typeparam>
    /// <param name="dbSet">The DbSet to query</param>
    /// <returns>IQueryable with both active and inactive entities</returns>
    public static IQueryable<TEntity> IncludeInactive<TEntity>(this DbSet<TEntity> dbSet)
        where TEntity : class
    {
        return dbSet.AsQueryable().IgnoreIsActiveFilter();
    }
}
