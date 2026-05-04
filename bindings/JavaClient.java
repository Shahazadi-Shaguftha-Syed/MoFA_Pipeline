import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * MoFA Java Client
 * Demonstrates Java interoperability with the MoFA Agent Pipeline API.
 * This represents the UniFFI binding layer — Java consuming the Rust-powered pipeline.
 *
 * Compile: javac JavaClient.java
 * Run:     java JavaClient
 * (Make sure the backend is running: uvicorn main:app --reload --port 8000)
 */
public class JavaClient {

    private static final String BASE_URL = "http://localhost:8000";
    private static final HttpClient client = HttpClient.newHttpClient();

    public static void main(String[] args) throws Exception {
        System.out.println("=================================================");
        System.out.println("  MoFA Agent Pipeline — Java Client");
        System.out.println("  UniFFI Interoperability Demonstration");
        System.out.println("=================================================\n");

        // 1. List available agents
        listAgents();

        // 2. Run a full pipeline
        runPipeline(
            "[\"Extractor\", \"Classifier\", \"Summarizer\"]",
            "MoFA is an excellent and powerful framework for building modular AI agents. It provides amazing tools for orchestration."
        );

        // 3. Run classifier only
        runPipeline(
            "[\"Classifier\"]",
            "This framework is terrible and broken. Nothing works as expected."
        );

        // 4. Run extractor + summarizer
        runPipeline(
            "[\"Extractor\", \"Summarizer\"]",
            "Artificial intelligence and machine learning are transforming software development. Developers now build intelligent systems with ease."
        );
    }

    static void listAgents() throws Exception {
        System.out.println(">>> GET /agents");
        System.out.println("-----------------------------");

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/agents"))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        System.out.println("Status: " + response.statusCode());
        System.out.println("Response: " + prettyPrint(response.body()));
        System.out.println();
    }

    static void runPipeline(String agentsJson, String inputText) throws Exception {
        System.out.println(">>> POST /run-agent");
        System.out.println("Input: " + inputText.substring(0, Math.min(60, inputText.length())) + "...");
        System.out.println("-----------------------------");

        String jsonBody = String.format(
            "{\"agents\": %s, \"input\": \"%s\"}",
            agentsJson,
            inputText.replace("\"", "\\\"")
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/run-agent"))
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        System.out.println("Status: " + response.statusCode());

        // Extract pipeline_id
        String body = response.body();
        String pipelineId = extractField(body, "pipeline_id");
        String finalOutput = extractField(body, "final_output");

        System.out.println("Pipeline ID: " + pipelineId);
        System.out.println("Final Output: " + finalOutput);
        System.out.println("Full Response: " + prettyPrint(body));

        // Fetch result by ID
        if (pipelineId != null && !pipelineId.isEmpty()) {
            fetchPipelineResult(pipelineId);
        }

        System.out.println();
    }

    static void fetchPipelineResult(String pipelineId) throws Exception {
        System.out.println(">>> GET /pipeline/" + pipelineId);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/pipeline/" + pipelineId))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        System.out.println("Stored Result Status: " + response.statusCode());
    }

    // Simple field extractor (no external JSON lib needed)
    static String extractField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key);
        if (start == -1) return "";
        start += key.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return "";
        return json.substring(start, end);
    }

    // Very basic pretty printer (indent after { [ , and before } ])
    static String prettyPrint(String json) {
        if (json.length() < 200) return json;
        return json.substring(0, 200) + "\n  ... [truncated for display]";
    }
}
