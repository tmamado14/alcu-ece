import ProblemEditor from "@/components/ProblemEditor";

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProblemEditor problemId={id} />;
}
