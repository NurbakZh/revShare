using oracle.Models;

namespace oracle.Data.Repositories.Interfaces;

public interface IUserRepository : IRepository<UserProfile>
{
    Task<UserProfile?> GetByPubkeyAsync(string pubkey, CancellationToken ct = default);
}