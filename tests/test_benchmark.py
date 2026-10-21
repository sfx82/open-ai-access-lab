import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from benchmarks.ollama_benchmark import Client, BenchmarkError, NoRedirect, measurement, run, save

METRICS = dict(done=True, eval_count=100, eval_duration=2_000_000_000, prompt_eval_count=30, prompt_eval_duration=100, load_duration=10, total_duration=2_000_000_200)

class Tests(unittest.TestCase):
    def test_formula(self):
        self.assertEqual(measurement(METRICS)['tokens_per_second'], 50)
    def test_invalid_metrics(self):
        for field in ('eval_count','eval_duration','total_duration'):
            with self.subTest(field=field), self.assertRaises(BenchmarkError):
                measurement(dict(METRICS, **{field:0}))
        for value in (True, -1, '100', None):
            with self.subTest(value=value), self.assertRaises(BenchmarkError):
                measurement(dict(METRICS, eval_count=value))
        with self.assertRaises(BenchmarkError): measurement(dict(METRICS,done=False))
    def test_http_run_and_serialization(self):
        client=Client(2)
        calls=[]
        def respond(req, timeout):
            calls.append((req.full_url, timeout, json.loads(req.data) if req.data else None))
            endpoint=req.full_url.rsplit('/',1)[-1]
            data={'version':'test-only'} if endpoint=='version' else {'models':[{'name':'mock:model','digest':'mock-digest'}]} if endpoint=='tags' else METRICS
            return io.BytesIO(json.dumps(data).encode())
        with patch.object(client.opener,'open',side_effect=respond):
            report=run(client,['mock:model'])
        self.assertEqual(len(report['models'][0]['runs']),3)
        self.assertEqual(report['models'][0]['median_tokens_per_second'],50)
        self.assertEqual(len(calls),7)
        self.assertTrue(all(url.startswith('http://127.0.0.1:11434/') and timeout==2 for url,timeout,_ in calls))
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'report.json'
            save(report,target)
            self.assertEqual(json.loads(target.read_text()),report)
            with self.assertRaises(FileExistsError): save(report,target)
    def test_median_is_per_run(self):
        client=Client()
        responses=[{'version':'mock'}, {'models':[{'name':'mock','digest':'digest'}]}, METRICS]
        responses += [dict(METRICS, eval_count=count) for count in (20,100,80)]
        responses += [{}]
        with patch.object(client,'request',side_effect=responses):
            report=run(client,['mock'])
        self.assertEqual(report['models'][0]['median_tokens_per_second'],40)
        self.assertEqual([r['tokens_per_second'] for r in report['models'][0]['runs']],[10,50,40])

    def test_http_errors(self):
        client=Client()
        for effect in (TimeoutError(), OSError(), None):
            with patch.object(client.opener,'open',side_effect=effect,return_value=io.BytesIO(b'not json')):
                with self.assertRaises(BenchmarkError): client.request('version')
        with patch.object(client.opener,'open',return_value=io.BytesIO(b'{"error":"private details"}')):
            with self.assertRaises(BenchmarkError): client.request('version')
    def test_redirect_blocked(self):
        with self.assertRaises(BenchmarkError): NoRedirect().redirect_request(None,None,302,'',{},'https://example.com')
    def test_minimum_runs_and_missing_model(self):
        with self.assertRaises(BenchmarkError): run(Client(),['x'],2)
        with patch.object(Client,'request',side_effect=[{'version':'mock'},{'models':[]}]):
            with self.assertRaises(BenchmarkError): run(Client(),['absent'])

if __name__=='__main__': unittest.main()
