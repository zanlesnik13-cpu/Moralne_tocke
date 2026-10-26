import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, X, Code2, Play } from 'lucide-react';

interface StreamlitCodeModalProps {
  onClose: () => void;
}

export const StreamlitCodeModal: React.FC<StreamlitCodeModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const pythonCode = `"""
Moralne Točke - Popolna Streamlit Python aplikacija
Zagon: streamlit run app.py
"""

import streamlit as st
import json
import os
from datetime import datetime

st.set_page_config(page_title="Moralne Točke", page_icon="⚖️", layout="wide")

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "moral_points.json")

DEFAULT_RULES = [
    {"id": "rule-1", "label": "predavanja", "points": -5, "isDirectChallenge": False},
    {"id": "rule-2", "label": "vaje", "points": -10, "isDirectChallenge": False},
    {"id": "rule-3", "label": "žreb", "points": -20, "isDirectChallenge": False},
    {"id": "rule-4", "label": "častiš 20eur", "points": 5, "isDirectChallenge": False},
    {"id": "rule-5", "label": "teden vse", "points": 10, "isDirectChallenge": False},
    {"id": "rule-6", "label": "zamutiš", "points": 10, "isDirectChallenge": False},
    {"id": "rule-7", "label": "seks", "points": 50, "isDirectChallenge": False},
    {"id": "rule-8", "label": "ne gre kdo vn", "points": -10, "isDirectChallenge": False},
    {"id": "rule-9", "label": "podpišeš", "points": 5, "isDirectChallenge": False},
    {"id": "rule-10", "label": "tožarjenje direkt challenge", "points": 0, "isDirectChallenge": True},
    {"id": "rule-11", "label": "ne igraš ludo kinga", "points": -5, "isDirectChallenge": False}
]

def load_data():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if not os.path.exists(DB_PATH):
        initial = {"users": {}, "rules": DEFAULT_RULES, "history": []}
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(initial, f, ensure_ascii=False, indent=2)
        return initial
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"users": {}, "rules": DEFAULT_RULES, "history": []}

def save_data(data):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def compute_scores(data):
    scores = {user: 0 for user in data.get("users", {})}
    for h in data.get("history", []):
        t = h.get("targetUser")
        scores[t] = scores.get(t, 0) + h.get("points", 0)
    return scores

# Prijava s PIN-om v st.session_state
if "authenticated_user" not in st.session_state:
    st.session_state.authenticated_user = None

data = load_data()
scores = compute_scores(data)

if not st.session_state.authenticated_user:
    st.title("⚖️ Prijava v Moralne Točke")
    with st.form("login_form"):
        name_input = st.text_input("Tvoje ime")
        pin_input = st.text_input("4-mestni PIN", type="password", max_chars=4)
        if st.form_submit_button("Vstopi"):
            if name_input and len(pin_input) == 4 and pin_input.isdigit():
                users = data.get("users", {})
                if name_input in users and users[name_input].get("pin") != pin_input:
                    st.error("Napačen PIN!")
                else:
                    if name_input not in users:
                        users[name_input] = {"pin": pin_input, "createdAt": datetime.now().isoformat()}
                        save_data(data)
                    st.session_state.authenticated_user = name_input
                    st.rerun()
    st.stop()

# Lestvica in agresivno opozorilo za -100 točk
current_user = st.session_state.authenticated_user
st.title("⚖️ Dnevnik Moralnih Točk")

penalty_users = [u for u, pt in scores.items() if pt <= -100]
for p in penalty_users:
    st.error(f"🚨 POZOR! {p} ima {scores[p]} točk (pod -100 točk)! Oseba mora nemudoma opraviti izziv!", icon="🚨")

# Lestvica
st.subheader("🏆 Lestvica")
for rank, (uname, score) in enumerate(sorted(scores.items(), key=lambda x: x[1], reverse=True), 1):
    if score <= -100:
        st.markdown(f"**🚨 #{rank} {uname}: {score} točk (OBVEZEN IZZIV!)**")
    else:
        st.markdown(f"#{rank} {uname}: {score:+d} točk")

# Vnos točk
st.subheader("➕ Dodelitev točk")
with st.form("points_form"):
    target = st.selectbox("Komu?", list(data.get("users", {}).keys()))
    pts = st.number_input("Točke", step=5)
    reason = st.text_input("Razlog")
    if st.form_submit_button("Potrdi"):
        data["history"].append({
            "id": f"tx-{int(datetime.now().timestamp())}",
            "timestamp": datetime.now().isoformat(),
            "recordedBy": current_user,
            "targetUser": target,
            "points": int(pts),
            "reason": reason
        })
        save_data(data)
        st.success("Točke uspešno dodane!")
        st.rerun()
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Python Streamlit Koda (app.py)
              </h3>
              <p className="text-xs text-slate-400">
                Pripravljena izvorna datoteka za samostojen zagon v Pythonu.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <Play className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zagon v terminalu: <b>pip install streamlit</b> nato <b>streamlit run app.py</b></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Kopirano!' : 'Kopiraj kodo'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Prenesi app.py
            </button>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-4 flex-1 overflow-auto rounded-2xl bg-slate-950 p-4 border border-slate-800 text-xs font-mono text-slate-300">
          <pre>{pythonCode}</pre>
        </div>
      </div>
    </div>
  );
};
