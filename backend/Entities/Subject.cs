namespace AssignmentSystemApi.Entities
{
    public class Subject
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int ClassId { get; set; }
        public Class Class { get; set; } = null!;
    }
}
