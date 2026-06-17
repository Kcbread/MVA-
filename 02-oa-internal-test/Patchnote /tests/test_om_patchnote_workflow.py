import tempfile
import unittest
from pathlib import Path

import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from om_patchnote_workflow import (  # noqa: E402
    build_daily_outputs,
    extract_comments,
    format_intake_markdown,
)


SOURCE_PPTX = ROOT / "2026617 System feedback .pptx"


class OmPatchnoteWorkflowTest(unittest.TestCase):
    def test_extracts_powerpoint_comments_with_slide_numbers(self):
        comments = extract_comments(SOURCE_PPTX)

        self.assertEqual(7, len(comments))
        self.assertEqual("OM-QA-20260617-001", comments[0]["id"])
        self.assertEqual(7, comments[0]["slide"])
        self.assertIn("will removed", comments[0]["comment"])
        self.assertEqual("Need Kai Confirmation", comments[0]["status"])

    def test_formats_daily_intake_with_pending_confirmation_and_retest_sections(self):
        markdown = format_intake_markdown(
            extract_comments(SOURCE_PPTX),
            date="20260617",
            source_pptx=SOURCE_PPTX,
            output_pptx=ROOT / "20260617 System feedback patchnote.pptx",
        )

        self.assertIn("# OM QA Patch Note Intake - 20260617", markdown)
        self.assertIn("## Pending Confirmation", markdown)
        self.assertIn("## OM Retest Checklist", markdown)
        self.assertIn("OM-QA-20260617-005", markdown)
        self.assertIn("Can export excel file", markdown)

    def test_build_daily_outputs_copies_template_and_writes_intake(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp)
            result = build_daily_outputs(
                source_pptx=SOURCE_PPTX,
                output_dir=out_dir,
                date="20260617",
            )

            self.assertTrue(result["pptx"].exists())
            self.assertTrue(result["intake"].exists())
            self.assertEqual(SOURCE_PPTX.stat().st_size, result["pptx"].stat().st_size)
            self.assertIn("Need Kai Confirmation", result["intake"].read_text())


if __name__ == "__main__":
    unittest.main()
