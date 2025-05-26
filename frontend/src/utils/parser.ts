import { JsonResponse, Step, StepType } from "@/types";

export function parseJson(response: string): Step[] {
  try {
    const cleanJson = response.replace(/```json\n?|\n?```/g, "").trim();
    const jsonResponse: JsonResponse = JSON.parse(cleanJson);
    const steps: Step[] = [];
    let stepId = 1;

    // First add the project tite and description as a step
    steps.push({
      id: stepId++,
      title: jsonResponse.title,
      description: jsonResponse.description,
      type: StepType.CreateFolder,
      status: "pending",
    });

    // The we process each step
    jsonResponse.steps.forEach((step) => {
      if (step.type === "file") {
        steps.push({
          id: stepId++,
          title: `Create ${step.path || "file"}`,
          description: "",
          type: StepType.CreateFile,
          status: "pending",
          code: step.content?.trim() || "",
          path: step.path,
        });
      } else if (step.type === "shell") {
        steps.push({
          id: stepId++,
          title: "Run command",
          description: "",
          type: StepType.RunScript,
          status: "pending",
          code: step.content?.trim() || "",
        });
      }
    });

    return steps;
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    return [];
  }
}
