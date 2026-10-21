import copy
import json
import unittest
from pathlib import Path
from benchmarks.validate_report import validate, compare_source

PUBLIC = Path(__file__).resolve().parents[1] / "public/results/ollama-v0.1-run01.json"

class PublishedReportTests(unittest.TestCase):
    def setUp(self):
        self.report = json.loads(PUBLIC.read_text())
    def test_real_report(self):
        validate(self.report)
        self.assertEqual(self.report["ollama_version"], "0.40.5")
        self.assertEqual([m["model"] for m in self.report["models"]], ["gemma3:4b", "mistral:7b-instruct-q4_0"])
        self.assertEqual([round(m["median_tokens_per_second"], 2) for m in self.report["models"]], [97.63, 74.31])
        self.assertEqual(sum(len(m["runs"]) for m in self.report["models"]), 6)
        self.assertTrue(all(r["eval_count"] == 256 for m in self.report["models"] for r in m["runs"]))
    def test_source_unchanged_when_available(self):
        source = PUBLIC.parents[2] / "results/ollama-v0.1-run01.json"
        if not source.exists():
            self.skipTest("Ignored original is local-only; public validation still runs in CI")
        compare_source(self.report, source)
    def test_reject_corruption(self):
        for field, value in [("eval_duration", 0), ("eval_count", True), ("tokens_per_second", 1), ("repetition", 3), ("total_duration", 1)]:
            report = copy.deepcopy(self.report)
            report["models"][0]["runs"][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                validate(report)
