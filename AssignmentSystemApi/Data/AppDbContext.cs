using AssignmentSystemApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Class> Classes { get; set; } = null!;
        public DbSet<Subject> Subjects { get; set; } = null!;
        public DbSet<TeacherSubjectAssignment> TeacherSubjectAssignments { get; set; } = null!;
        public DbSet<Assignment> Assignments { get; set; } = null!;
        public DbSet<Submission> Submissions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(b =>
            {
                b.HasIndex(u => u.Email).IsUnique();
                b.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
            });

            modelBuilder.Entity<Subject>(b =>
            {
                b.HasIndex(s => new { s.Name, s.ClassId }).IsUnique();
            });

            modelBuilder.Entity<TeacherSubjectAssignment>(b =>
            {
                b.HasIndex(t => new { t.TeacherId, t.SubjectId }).IsUnique();
                b.HasOne(t => t.Teacher).WithMany();
                b.HasOne(t => t.Subject).WithMany();
            });

            modelBuilder.Entity<Assignment>(b =>
            {
                b.Property(a => a.Status).HasDefaultValue("Draft");
                b.Property(a => a.CreatedAt).HasDefaultValueSql("now()");
                b.HasOne(a => a.Subject).WithMany();
                b.HasOne(a => a.Teacher).WithMany();
            });

            modelBuilder.Entity<Submission>(b =>
            {
                b.HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique();
                b.Property(s => s.SubmittedAt).HasDefaultValueSql("now()");
                b.Property(s => s.SubmissionStatus).HasDefaultValue("Submitted");
                b.Property(s => s.GradingStatus).HasDefaultValue("Pending");
            });
        }
    }
}
