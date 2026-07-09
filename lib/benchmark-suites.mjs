// FallMarket · standard benchmark suite specifications
// A benchmark is a signed test result produced by a neutral runner.
// Each suite defines: input shape, pass criteria, weight, kind compatibility.

export const SUITE_REGISTRY = {
  'mcp-basic-v1': {
    id: 'mcp-basic-v1',
    kind: 'mcp',
    description: 'Verifies MCP server responds to list_tools, list_resources, and calls each tool with empty args without crashing.',
    weight: 1.0,
    version: '1.0.0',
    steps: [
      { name: 'stdio_startup', pass_if: 'boots_within_ms < 5000' },
      { name: 'list_tools', pass_if: 'returns_array && length > 0' },
      { name: 'list_resources', pass_if: 'returns_array' },
      { name: 'call_first_tool_empty_args', pass_if: 'no_throw' },
      { name: 'graceful_shutdown', pass_if: 'exits_on_close' }
    ],
    max_score: 5,
    pass_threshold: 3
  },

  'sdk-import-v1': {
    id: 'sdk-import-v1',
    kind: 'sdk',
    description: 'Verifies SDK imports cleanly, exports at least one function, and can be called without crashing.',
    weight: 1.0,
    version: '1.0.0',
    steps: [
      { name: 'npm_import', pass_if: 'no_error' },
      { name: 'has_exports', pass_if: 'exports_count > 0' },
      { name: 'has_named_export', pass_if: 'named_exports_count > 0 || default_export' },
      { name: 'call_first_function', pass_if: 'no_throw_on_empty_call' },
      { name: 'esm_type_module', pass_if: 'package_type_is_module' }
    ],
    max_score: 5,
    pass_threshold: 3
  },

  'api-uptime-30d': {
    id: 'api-uptime-30d',
    kind: 'api',
    description: 'Rolling 30-day uptime check on published API endpoint (health probe every 5 min).',
    weight: 1.0,
    version: '1.0.0',
    steps: [
      { name: 'health_endpoint_exists', pass_if: '/health returns 200' },
      { name: 'response_time_p95', pass_if: 'p95_ms < 2000' },
      { name: 'uptime_pct', pass_if: 'uptime >= 99.0' }
    ],
    max_score: 3,
    pass_threshold: 2
  },

  'api-basic-v1': {
    id: 'api-basic-v1',
    kind: 'api',
    description: 'One-time verification that API boots, health endpoint returns 200, and at least one route exists.',
    weight: 1.0,
    version: '1.0.0',
    steps: [
      { name: 'docker_build', pass_if: 'docker_build_succeeds' },
      { name: 'container_starts', pass_if: 'boots_within_ms < 10000' },
      { name: 'health_ok', pass_if: 'get_health_200' },
      { name: 'has_documented_routes', pass_if: 'route_count > 0' }
    ],
    max_score: 4,
    pass_threshold: 3
  },

  'tool-load-v1': {
    id: 'tool-load-v1',
    kind: 'tool',
    description: 'Verifies standalone HTML tool loads without errors and renders a body.',
    weight: 1.0,
    version: '1.0.0',
    steps: [
      { name: 'html_valid', pass_if: 'parses_as_html' },
      { name: 'no_external_requires', pass_if: 'file_url_works' },
      { name: 'renders_body', pass_if: 'body_innerText_length > 0' },
      { name: 'no_console_errors', pass_if: 'console_error_count === 0' }
    ],
    max_score: 4,
    pass_threshold: 3
  },

  'buyer-supplied-v1': {
    id: 'buyer-supplied-v1',
    kind: '*',
    description: 'Buyer uploads their own test case with input and expected output. Runner passes it against the product before transaction completes.',
    weight: 2.0, // higher weight because it's specific proof of fitness
    version: '1.0.0',
    steps: [
      { name: 'run_case', pass_if: 'expected_matches_actual' }
    ],
    max_score: 1,
    pass_threshold: 1
  },

  'hallucination-thomas-v1': {
    id: 'hallucination-thomas-v1',
    kind: '*',
    description: 'Multi-tier hallucination elimination benchmark · cultural grounding + Triad Engine · adapted from teslasolar/hallucination-elimination-benchmark (Thomas). Detects and scores false content generation.',
    weight: 1.5,
    version: '1.0.0',
    source: 'https://github.com/sjgant80-hub/hallucination-elimination-benchmark',
    steps: [
      { name: 'baseline_prompt_recall', pass_if: 'accuracy > 0.8' },
      { name: 'cultural_grounding_check', pass_if: 'cultural_score > 0.7' },
      { name: 'triad_consistency', pass_if: 'triad_pass_rate > 0.9' },
      { name: 'known_hallucination_regression', pass_if: 'known_hallucinations_avoided_count > 0.95' }
    ],
    max_score: 4,
    pass_threshold: 3
  },

  'public-safe-v1': {
    id: 'public-safe-v1',
    kind: '*',
    description: 'Verifies the listing contains no private-cosmology leaks (SPINE/KAPPA/OMEGA/dyad/glyph refs) in README or public source.',
    weight: 0.5,
    version: '1.0.0',
    steps: [
      { name: 'readme_clean', pass_if: 'no_leak_pattern_in_readme' },
      { name: 'source_clean', pass_if: 'no_leak_pattern_in_src' }
    ],
    max_score: 2,
    pass_threshold: 2
  }
};

export function suitesForKind(kind) {
  return Object.values(SUITE_REGISTRY).filter(s => s.kind === kind || s.kind === '*');
}

export function getSuite(id) {
  return SUITE_REGISTRY[id];
}
