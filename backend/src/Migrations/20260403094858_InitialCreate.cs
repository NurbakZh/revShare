using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace oracle.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Businesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Pubkey = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: false),
                    OwnerPubkey = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    RaiseLimit = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    TargetRevenue = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    ConsecutivePayments = table.Column<int>(type: "integer", nullable: false),
                    HasDefaulted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Businesses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RevenueRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessPubkey = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: false),
                    Epoch = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TxSignature = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevenueRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TokenListings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingPubkey = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: false),
                    BusinessPubkey = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: false),
                    SellerPubkey = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    PricePerToken = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenListings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Pubkey = table.Column<string>(type: "character varying(44)", maxLength: 44, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Bio = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    HasBusiness = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfiles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Businesses_Pubkey",
                table: "Businesses",
                column: "Pubkey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RevenueRecords_BusinessPubkey",
                table: "RevenueRecords",
                column: "BusinessPubkey");

            migrationBuilder.CreateIndex(
                name: "IX_TokenListings_BusinessPubkey",
                table: "TokenListings",
                column: "BusinessPubkey");

            migrationBuilder.CreateIndex(
                name: "IX_TokenListings_ListingPubkey",
                table: "TokenListings",
                column: "ListingPubkey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_Pubkey",
                table: "UserProfiles",
                column: "Pubkey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Businesses");

            migrationBuilder.DropTable(
                name: "RevenueRecords");

            migrationBuilder.DropTable(
                name: "TokenListings");

            migrationBuilder.DropTable(
                name: "UserProfiles");
        }
    }
}
