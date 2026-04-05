using Microsoft.EntityFrameworkCore;
using oracle.Data.Repositories.Interfaces;
using oracle.Models;

namespace oracle.Data.Repositories;

public class UserRepository(AppDbContext context) : BaseRepository<UserProfile>(context), IUserRepository
{
    public async Task<UserProfile?> GetByPubkeyAsync(string pubkey, CancellationToken ct = default)
        => await DbSet.FirstOrDefaultAsync(x => x.Pubkey == pubkey, ct);
}