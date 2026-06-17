#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap

ROOT = Path(__file__).resolve().parents[1]
DFD_DIR = ROOT / "docs-current" / "IT_MEETING_PACKAGE_20260604" / "04-dfd"

FONT_CANDIDATES = [
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


F_TITLE = font(46)
F_SUB = font(24)
F_BOX = font(22)
F_SMALL = font(18)
F_BADGE = font(16)


PALETTE = {
    "bg": "#f7fbff",
    "ink": "#14243a",
    "muted": "#526678",
    "requester": "#d9ebff",
    "manager": "#dff2df",
    "om": "#ffe6c8",
    "dri": "#fff3bd",
    "db": "#f0e6ff",
    "audit": "#eeeeee",
    "line": "#40566d",
    "reject": "#b83a3a",
    "approve": "#2d7d46",
}


def wrap(text: str, width: int = 24) -> list[str]:
    lines: list[str] = []
    for part in text.split("\n"):
        lines.extend(textwrap.wrap(part, width=width) or [""])
    return lines


def draw_box(draw: ImageDraw.ImageDraw, xy, text, fill, outline="#7e99ae", width=3, radius=18, text_width=23):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)
    lines = wrap(text, text_width)
    total_h = len(lines) * 29
    y = y1 + (y2 - y1 - total_h) / 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=F_BOX)
        draw.text((x1 + (x2 - x1 - (bbox[2] - bbox[0])) / 2, y), line, fill=PALETTE["ink"], font=F_BOX)
        y += 29


def arrow(draw, start, end, color=None, label=None):
    color = color or PALETTE["line"]
    draw.line([start, end], fill=color, width=4)
    sx, sy = start
    ex, ey = end
    if abs(ex - sx) >= abs(ey - sy):
        direction = 1 if ex >= sx else -1
        points = [(ex, ey), (ex - 18 * direction, ey - 9), (ex - 18 * direction, ey + 9)]
    else:
        direction = 1 if ey >= sy else -1
        points = [(ex, ey), (ex - 9, ey - 18 * direction), (ex + 9, ey - 18 * direction)]
    draw.polygon(points, fill=color)
    if label:
        lx = (sx + ex) / 2
        ly = (sy + ey) / 2 - 28
        draw.rounded_rectangle((lx - 120, ly - 4, lx + 120, ly + 28), radius=8, fill="#ffffff", outline="#d4dce5")
        draw.text((lx - 112, ly), label, fill=color, font=F_BADGE)


def title(draw, main, sub):
    draw.text((70, 35), main, fill=PALETTE["ink"], font=F_TITLE)
    draw.text((72, 92), sub, fill=PALETTE["muted"], font=F_SUB)


def save(img: Image.Image, name: str):
    out = DFD_DIR / name
    img.convert("RGB").save(out, "JPEG", quality=92, optimize=True)
    print(out)


def context():
    img = Image.new("RGB", (2200, 1350), PALETTE["bg"])
    d = ImageDraw.Draw(img)
    title(d, "Context DFD / 系統脈絡圖", "Requester mapping uses Project Family + Project Code + Demand Department. Station never decides requester.")
    boxes = {
        "Requester\n需求提出者": (90, 250, 410, 410, PALETTE["requester"]),
        "Manager B\n審批與成本檢視": (90, 570, 410, 730, PALETTE["manager"]),
        "Dept DRI\n部門確認": (90, 890, 410, 1050, PALETTE["dri"]),
        "Budget Approver\n預算核准": (570, 890, 890, 1050, PALETTE["dri"]),
        "OM Leader\nMai 派工 / 匯率": (1570, 250, 1890, 410, PALETTE["om"]),
        "OM Purchasing\nPAS / Quote / Export": (1570, 570, 1890, 730, PALETTE["om"]),
        "Admin\nMapping / Access setup": (1570, 890, 1890, 1050, "#e9eef5"),
        "MySQL POC DB\nshared workflow data": (800, 420, 1220, 620, PALETTE["db"]),
        "audit_events\nappend-only trail": (800, 720, 1220, 880, PALETTE["audit"]),
    }
    centers = {}
    for text, (x1, y1, x2, y2, fill) in boxes.items():
        draw_box(d, (x1, y1, x2, y2), text, fill, text_width=19)
        centers[text] = ((x1 + x2) // 2, (y1 + y2) // 2)
    for k in ["Requester\n需求提出者", "Manager B\n審批與成本檢視", "Dept DRI\n部門確認", "Budget Approver\n預算核准", "OM Leader\nMai 派工 / 匯率", "OM Purchasing\nPAS / Quote / Export", "Admin\nMapping / Access setup"]:
        sx, sy = centers[k]
        ex, ey = centers["MySQL POC DB\nshared workflow data"]
        arrow(d, (sx + (170 if sx < ex else -170), sy), (ex + (-230 if sx < ex else 230), ey), label="read/write")
    arrow(d, (1010, 620), (1010, 720), label="audit")
    save(img, "01-context-dfd-bilingual.jpeg")


def level1():
    img = Image.new("RGB", (2600, 1550), PALETTE["bg"])
    d = ImageDraw.Draw(img)
    title(d, "Level 1 Cross-role DFD / 跨角色資料流程", "Closed loop included: reject returns to Requester revise/resubmit; price exceptions go Dept DRI -> Budget Approver.")
    rows = [
        ("Requester / 需求端", 170, PALETTE["requester"]),
        ("Manager B", 470, PALETTE["manager"]),
        ("OM Purchasing", 770, PALETTE["om"]),
        ("Dept DRI / Budget Approver", 1070, PALETTE["dri"]),
        ("Data Stores", 1270, PALETTE["db"]),
    ]
    for label, y, fill in rows:
        d.rounded_rectangle((50, y - 35, 2550, y + 230), radius=18, fill=fill, outline="#c9d6e4")
        d.text((75, y - 20), label, fill=PALETTE["ink"], font=F_SUB)
    box_defs = [
        ("Request Workspace\nAdd/Reuse + Need Date", (170, 230, 470, 370), PALETTE["requester"]),
        ("Edit Demand Rows\nMFG station / Non-MFG unit", (570, 230, 870, 370), PALETTE["requester"]),
        ("Submit Package", (970, 230, 1270, 370), PALETTE["requester"]),
        ("Revise / Resubmit", (1470, 230, 1770, 370), PALETTE["requester"]),
        ("Pending Approval", (250, 530, 550, 670), PALETTE["manager"]),
        ("Approve / Reject", (700, 530, 1000, 670), "#fff8d9"),
        ("Cost Dashboard\nStation Matrix", (1150, 530, 1450, 670), PALETTE["manager"]),
        ("PAS Demand No", (250, 830, 550, 970), PALETTE["om"]),
        ("PAS Quote Result\nQuote + Validity + Files", (700, 830, 1000, 970), PALETTE["om"]),
        ("Price Decision", (1150, 830, 1450, 970), "#fff8d9"),
        ("Export Package\nExpense->ECS / Capex->CFA", (1800, 830, 2150, 970), PALETTE["om"]),
        ("Dept DRI Review", (700, 1130, 1000, 1270), PALETTE["dri"]),
        ("Budget Approver Review", (1150, 1130, 1450, 1270), PALETTE["dri"]),
        ("requests + demand_lines", (250, 1320, 600, 1450), PALETTE["db"]),
        ("approvals + pas_quotes + exports", (750, 1320, 1200, 1450), PALETTE["db"]),
        ("audit_events", (1350, 1320, 1650, 1450), PALETTE["audit"]),
    ]
    centers = {}
    for text, xy, fill in box_defs:
        draw_box(d, xy, text, fill, text_width=20)
        x1, y1, x2, y2 = xy
        centers[text] = ((x1 + x2) // 2, (y1 + y2) // 2)
    seq = ["Request Workspace\nAdd/Reuse + Need Date", "Edit Demand Rows\nMFG station / Non-MFG unit", "Submit Package", "Pending Approval", "Approve / Reject", "Cost Dashboard\nStation Matrix", "PAS Demand No", "PAS Quote Result\nQuote + Validity + Files", "Price Decision"]
    for a, b in zip(seq, seq[1:]):
        arrow(d, centers[a], centers[b])
    arrow(d, centers["Approve / Reject"], centers["Revise / Resubmit"], color=PALETTE["reject"], label="reject")
    arrow(d, centers["Revise / Resubmit"], centers["Submit Package"], color=PALETTE["approve"], label="resubmit")
    arrow(d, centers["Price Decision"], centers["Export Package\nExpense->ECS / Capex->CFA"], color=PALETTE["approve"], label="auto cleared")
    arrow(d, centers["Price Decision"], centers["Dept DRI Review"], color="#9a6a00", label="escalate")
    arrow(d, centers["Dept DRI Review"], centers["Budget Approver Review"], color="#9a6a00")
    arrow(d, centers["Budget Approver Review"], centers["Export Package\nExpense->ECS / Capex->CFA"], color=PALETTE["approve"], label="approve")
    arrow(d, centers["Dept DRI Review"], centers["Revise / Resubmit"], color=PALETTE["reject"], label="reject")
    arrow(d, centers["Budget Approver Review"], centers["Revise / Resubmit"], color=PALETTE["reject"], label="reject")
    for k in ["Submit Package", "Approve / Reject", "PAS Quote Result\nQuote + Validity + Files", "Export Package\nExpense->ECS / Capex->CFA"]:
        arrow(d, centers[k], centers["approvals + pas_quotes + exports"], label="write")
    arrow(d, centers["approvals + pas_quotes + exports"], centers["audit_events"], label="append")
    save(img, "02-level1-cross-role-dfd-bilingual.jpeg")


def closed_loop():
    img = Image.new("RGB", (2200, 1400), PALETTE["bg"])
    d = ImageDraw.Draw(img)
    title(d, "Reject / Amendment Closed-loop DFD / 拒絕與修改閉環", "No dead end: every reject or post-quote amendment returns to a named owner with reason and audit trail.")
    defs = [
        ("Requester\nRevise demand\n需求修正", (110, 260, 430, 430), PALETTE["requester"]),
        ("Manager B\nReview package\n審批", (780, 260, 1100, 430), PALETTE["manager"]),
        ("OM Purchasing\nQuote / amendment\n詢價與改單", (1450, 260, 1770, 430), PALETTE["om"]),
        ("Dept DRI\nException review\n部門確認", (450, 760, 770, 930), PALETTE["dri"]),
        ("Budget Approver\nFinal approval\n預算核准", (1050, 760, 1370, 930), PALETTE["dri"]),
        ("Export Package\nCFA/ECS", (1650, 760, 1970, 930), PALETTE["om"]),
        ("MySQL workflow state", (670, 1110, 1030, 1260), PALETTE["db"]),
        ("audit_events", (1230, 1110, 1530, 1260), PALETTE["audit"]),
    ]
    centers = {}
    for text, xy, fill in defs:
        draw_box(d, xy, text, fill, text_width=18)
        x1, y1, x2, y2 = xy
        centers[text] = ((x1 + x2) // 2, (y1 + y2) // 2)
    arrow(d, centers["Requester\nRevise demand\n需求修正"], centers["Manager B\nReview package\n審批"], label="submit")
    arrow(d, centers["Manager B\nReview package\n審批"], centers["OM Purchasing\nQuote / amendment\n詢價與改單"], color=PALETTE["approve"], label="approve")
    arrow(d, centers["Manager B\nReview package\n審批"], centers["Requester\nRevise demand\n需求修正"], color=PALETTE["reject"], label="reject + reason")
    arrow(d, centers["OM Purchasing\nQuote / amendment\n詢價與改單"], centers["Requester\nRevise demand\n需求修正"], color=PALETTE["reject"], label="reject/change")
    arrow(d, centers["OM Purchasing\nQuote / amendment\n詢價與改單"], centers["Dept DRI\nException review\n部門確認"], label="price exception")
    arrow(d, centers["Dept DRI\nException review\n部門確認"], centers["Budget Approver\nFinal approval\n預算核准"], color=PALETTE["approve"], label="approve")
    arrow(d, centers["Dept DRI\nException review\n部門確認"], centers["Requester\nRevise demand\n需求修正"], color=PALETTE["reject"], label="reject")
    arrow(d, centers["Budget Approver\nFinal approval\n預算核准"], centers["Export Package\nCFA/ECS"], color=PALETTE["approve"], label="approve")
    arrow(d, centers["Budget Approver\nFinal approval\n預算核准"], centers["Requester\nRevise demand\n需求修正"], color=PALETTE["reject"], label="reject")
    for k in list(centers)[:6]:
        arrow(d, centers[k], centers["MySQL workflow state"], label="write")
    arrow(d, centers["MySQL workflow state"], centers["audit_events"], label="append")
    save(img, "03-reject-amendment-closed-loop-dfd-bilingual.jpeg")


def datastore():
    img = Image.new("RGB", (2400, 1500), PALETTE["bg"])
    d = ImageDraw.Draw(img)
    title(d, "Data Store / Audit Trail DFD / 資料庫與稽核流", "Browser never connects to MySQL directly. API owns sessions, role authorization, transactions, and append-only audit.")
    defs = [
        ("Browser UI\nno direct MySQL", (120, 250, 420, 400), PALETTE["requester"]),
        ("Node / Express API\nsession + role authorization", (660, 250, 1060, 400), "#d8f0ff"),
        ("users / sessions", (1280, 160, 1580, 300), PALETTE["db"]),
        ("project_requester_mapping\nFamily + Code + Dept", (1720, 160, 2100, 300), PALETTE["db"]),
        ("requests", (1280, 420, 1580, 560), PALETTE["db"]),
        ("request_demand_lines\nMFG station or Non-MFG unit", (1720, 420, 2100, 560), PALETTE["db"]),
        ("approvals", (1280, 680, 1580, 820), PALETTE["db"]),
        ("pas_quotes", (1720, 680, 2100, 820), PALETTE["db"]),
        ("exports", (1280, 940, 1580, 1080), PALETTE["db"]),
        ("om_assignments\nMai -> Giang/Linh/Mai", (1720, 940, 2100, 1080), PALETTE["db"]),
        ("attachments metadata\nfilename/type only v1", (1280, 1200, 1580, 1340), PALETTE["audit"]),
        ("audit_events\nappend-only", (1720, 1200, 2100, 1340), PALETTE["audit"]),
    ]
    centers = {}
    for text, xy, fill in defs:
        draw_box(d, xy, text, fill, text_width=22)
        x1, y1, x2, y2 = xy
        centers[text] = ((x1 + x2) // 2, (y1 + y2) // 2)
    arrow(d, centers["Browser UI\nno direct MySQL"], centers["Node / Express API\nsession + role authorization"], label="API only")
    for text in list(centers)[2:]:
        arrow(d, centers["Node / Express API\nsession + role authorization"], centers[text], label="read/write")
    arrow(d, centers["project_requester_mapping\nFamily + Code + Dept"], centers["requests"], label="resolve requester")
    arrow(d, centers["requests"], centers["request_demand_lines\nMFG station or Non-MFG unit"])
    arrow(d, centers["request_demand_lines\nMFG station or Non-MFG unit"], centers["approvals"])
    arrow(d, centers["approvals"], centers["pas_quotes"])
    arrow(d, centers["pas_quotes"], centers["exports"])
    arrow(d, centers["exports"], centers["audit_events\nappend-only"], label="audit")
    save(img, "04-data-store-audit-dfd-bilingual.jpeg")


if __name__ == "__main__":
    DFD_DIR.mkdir(parents=True, exist_ok=True)
    context()
    level1()
    closed_loop()
    datastore()
