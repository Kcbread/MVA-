#!/usr/bin/env python3
"""Build the daily OM QA patch-note intake from PowerPoint comments."""

from __future__ import annotations

import argparse
import csv
import html
import re
import shutil
from dataclasses import dataclass
from datetime import date as date_type
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET
from zipfile import ZipFile


P_NS = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"


@dataclass(frozen=True)
class CommentItem:
    id: str
    slide: int
    author: str
    timestamp: str
    comment: str
    inferred_screen: str
    status: str
    owner: str
    confirmation_needed: str

    def as_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "slide": self.slide,
            "author": self.author,
            "timestamp": self.timestamp,
            "comment": self.comment,
            "inferred_screen": self.inferred_screen,
            "status": self.status,
            "owner": self.owner,
            "confirmation_needed": self.confirmation_needed,
        }


def _slide_comment_map(zip_file: ZipFile) -> dict[str, int]:
    comment_to_slide: dict[str, int] = {}
    for rel_name in zip_file.namelist():
        if not rel_name.startswith("ppt/slides/_rels/slide") or not rel_name.endswith(".xml.rels"):
            continue

        slide_match = re.search(r"slide(\d+)\.xml\.rels$", rel_name)
        if not slide_match:
            continue

        slide_number = int(slide_match.group(1))
        root = ET.fromstring(zip_file.read(rel_name))
        for rel in root:
            target = rel.attrib.get("Target", "")
            rel_type = rel.attrib.get("Type", "")
            if "comments" not in target and "comments" not in rel_type:
                continue
            comment_to_slide[Path(target).name] = slide_number
    return comment_to_slide


def _comment_authors(zip_file: ZipFile) -> dict[str, str]:
    if "ppt/commentAuthors.xml" not in zip_file.namelist():
        return {}

    authors: dict[str, str] = {}
    root = ET.fromstring(zip_file.read("ppt/commentAuthors.xml"))
    for author in root:
        author_id = author.attrib.get("id")
        if not author_id:
            continue
        authors[author_id] = author.attrib.get("name") or author.attrib.get("initials") or author_id
    return authors


def _infer_screen(comment: str) -> str:
    lower = comment.lower()
    if "export" in lower or "excel" in lower or "csv" in lower:
        return "OM Export / filtered request output"
    if "assign" in lower or "giang" in lower or "linh" in lower:
        return "OM Assignment Control"
    if "filter" in lower or "project" in lower or "item" in lower:
        return "OM Submission Dashboard"
    if "pending" in lower or "po" in lower or "shipping" in lower or "budget" in lower:
        return "OM Purchasing Process Status"
    if "removed" in lower or "remove" in lower:
        return "Prototype-only UI cleanup"
    return "Need screen confirmation"


def _status_for(comment: str) -> str:
    lower = comment.lower()
    if "let me know" in lower or "if possible" in lower or "?" in comment:
        return "Question/Clarification"
    return "Need Kai Confirmation"


def _owner_for(comment: str, screen: str) -> str:
    lower = f"{comment} {screen}".lower()
    if "assign" in lower or "filter" in lower or "feedback" in lower:
        return "Kai + OM Leader"
    if "export" in lower or "pending" in lower or "quote" in lower:
        return "Kai + OM Team"
    return "Kai"


def _confirmation_for(comment: str, status: str) -> str:
    if status == "Question/Clarification":
        return "Confirm expected behavior before implementation."
    if "removed" in comment.lower() or "remove" in comment.lower():
        return "Confirm this is prototype-only UI and safe to remove."
    return "Confirm exact UI/behavior change before implementation."


def _date_from_comments(comments: Iterable[CommentItem]) -> str:
    for comment in comments:
        if comment.timestamp:
            return comment.timestamp[:10].replace("-", "")
    return date_type.today().strftime("%Y%m%d")


def extract_comments(source_pptx: Path | str, date: str | None = None) -> list[dict[str, object]]:
    source = Path(source_pptx)
    with ZipFile(source) as zip_file:
        authors = _comment_authors(zip_file)
        comment_to_slide = _slide_comment_map(zip_file)
        comment_paths = sorted(
            name for name in zip_file.namelist() if name.startswith("ppt/comments/comment") and name.endswith(".xml")
        )

        raw_items: list[CommentItem] = []
        for comment_path in comment_paths:
            comment_file = Path(comment_path).name
            slide = comment_to_slide.get(comment_file, 0)
            root = ET.fromstring(zip_file.read(comment_path))
            for cm in root.findall(f".//{P_NS}cm"):
                text_node = cm.find(f"{P_NS}text")
                comment_text = " ".join((text_node.text or "").split()) if text_node is not None else ""
                if not comment_text:
                    continue

                screen = _infer_screen(comment_text)
                status = _status_for(comment_text)
                raw_items.append(
                    CommentItem(
                        id="",
                        slide=slide,
                        author=authors.get(cm.attrib.get("authorId", ""), cm.attrib.get("authorId", "")),
                        timestamp=cm.attrib.get("dt", ""),
                        comment=comment_text,
                        inferred_screen=screen,
                        status=status,
                        owner=_owner_for(comment_text, screen),
                        confirmation_needed=_confirmation_for(comment_text, status),
                    )
                )

    day = date or _date_from_comments(raw_items)
    return [
        CommentItem(
            id=f"OM-QA-{day}-{index:03d}",
            slide=item.slide,
            author=item.author,
            timestamp=item.timestamp,
            comment=item.comment,
            inferred_screen=item.inferred_screen,
            status=item.status,
            owner=item.owner,
            confirmation_needed=item.confirmation_needed,
        ).as_dict()
        for index, item in enumerate(raw_items, start=1)
    ]


def _md_cell(value: object) -> str:
    text = str(value).replace("\n", "<br>").replace("|", "\\|")
    return html.escape(text, quote=False)


def format_intake_markdown(
    comments: list[dict[str, object]],
    date: str,
    source_pptx: Path | str,
    output_pptx: Path | str,
) -> str:
    source = Path(source_pptx)
    output = Path(output_pptx)
    pending_count = sum(1 for item in comments if item["status"] == "Need Kai Confirmation")
    question_count = sum(1 for item in comments if item["status"] == "Question/Clarification")

    lines = [
        f"# OM QA Patch Note Intake - {date}",
        "",
        "## Summary",
        "",
        f"- Source PPT: `{source.name}`",
        f"- Daily PPT output: `{output.name}`",
        f"- Extracted comments: {len(comments)}",
        f"- Need Kai Confirmation: {pending_count}",
        f"- Question/Clarification: {question_count}",
        "- Confirmed Fix: 0 (comments are treated as draft until Kai confirms each item)",
        "",
        "## Pending Confirmation",
        "",
        "| ID | Slide | Reporter | Inferred Screen | Status | Owner | Comment | Confirmation Needed |",
        "| --- | ---: | --- | --- | --- | --- | --- | --- |",
    ]

    for item in comments:
        lines.append(
            "| {id} | {slide} | {author} | {screen} | {status} | {owner} | {comment} | {confirm} |".format(
                id=_md_cell(item["id"]),
                slide=_md_cell(item["slide"]),
                author=_md_cell(item["author"]),
                screen=_md_cell(item["inferred_screen"]),
                status=_md_cell(item["status"]),
                owner=_md_cell(item["owner"]),
                comment=_md_cell(item["comment"]),
                confirm=_md_cell(item["confirmation_needed"]),
            )
        )

    lines.extend(
        [
            "",
            "## Confirmed Fixes",
            "",
            "| ID | Change Made | Evidence Screenshot | Verification | Residual Risk |",
            "| --- | --- | --- | --- | --- |",
            "| none yet | Waiting for Kai to confirm each fix instruction. | n/a | n/a | n/a |",
            "",
            "## OM Retest Checklist",
            "",
            "- [ ] Mai can review OM feedback and assignment-related changes.",
            "- [ ] Giang/Linh only retest assigned-row behavior when a confirmed fix affects them.",
            "- [ ] Each confirmed item has Feedback / Change Made / How to Retest / Evidence / Status in the daily PPT.",
            "- [ ] Any skipped browser/accessibility check is explicitly marked as skipped, not passed.",
            "",
            "## Notes",
            "",
            "- This file is the daily intake ledger. The PPT is the OM-facing retest guide.",
            "- Do not treat these comments as completed fixes until Kai confirms an item and verification evidence is attached.",
        ]
    )
    return "\n".join(lines) + "\n"


def write_csv(comments: list[dict[str, object]], csv_path: Path) -> None:
    fieldnames = [
        "id",
        "slide",
        "author",
        "timestamp",
        "inferred_screen",
        "status",
        "owner",
        "confirmation_needed",
        "comment",
    ]
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for item in comments:
            writer.writerow({name: item.get(name, "") for name in fieldnames})


def build_daily_outputs(source_pptx: Path | str, output_dir: Path | str, date: str | None = None) -> dict[str, Path]:
    source = Path(source_pptx)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    comments = extract_comments(source, date=date)
    day = date or (str(comments[0]["id"]).split("-")[2] if comments else date_type.today().strftime("%Y%m%d"))

    pptx_path = output / f"{day} System feedback patchnote.pptx"
    intake_path = output / f"{day} OM QA patchnote intake.md"
    csv_path = output / f"{day} OM QA patchnote intake.csv"

    shutil.copy2(source, pptx_path)
    intake_path.write_text(
        format_intake_markdown(comments, day, source_pptx=source, output_pptx=pptx_path),
        encoding="utf-8",
    )
    write_csv(comments, csv_path)
    return {"pptx": pptx_path, "intake": intake_path, "csv": csv_path}


def main() -> int:
    parser = argparse.ArgumentParser(description="Build daily OM QA patch-note intake from a source PPTX.")
    parser.add_argument("--source", required=True, type=Path, help="Source PPTX with PowerPoint comments.")
    parser.add_argument("--output-dir", required=True, type=Path, help="Directory for daily PPT/intake outputs.")
    parser.add_argument("--date", type=str, help="Output date in YYYYMMDD. Defaults to first comment date.")
    args = parser.parse_args()

    result = build_daily_outputs(args.source, args.output_dir, args.date)
    for key, path in result.items():
        print(f"{key}: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
