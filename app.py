"""
Moralne Točke - Popolna Streamlit Python aplikacija
Zagon z: streamlit run app.py
"""

import streamlit as st
import json
import os
from datetime import datetime

# Nastavitev strani
st.set_page_config(
    page_title="Moralne Točke",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "moral_points.json")

# Privzeta pravila po navodilih
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
        initial = {
            "users": {},
            "rules": DEFAULT_RULES,
            "history": []
        }
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(initial, f, ensure_ascii=False, indent=2)
        return initial
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        st.error(f"Napaka pri branju baze: {e}")
        return {"users": {}, "rules": DEFAULT_RULES, "history": []}

def save_data(data):
    try:
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        st.error(f"Napaka pri shranjevanju: {e}")

def compute_scores(data):
    scores = {}
    for user in data.get("users", {}):
        scores[user] = 0
    for h in data.get("history", []):
        t = h.get("targetUser")
        pts = h.get("points", 0)
        scores[t] = scores.get(t, 0) + pts
    return scores

# Inicializacija seje v st.session_state
if "authenticated_user" not in st.session_state:
    st.session_state.authenticated_user = None
if "user_pin" not in st.session_state:
    st.session_state.user_pin = None
if "editing_rules" not in st.session_state:
    st.session_state.editing_rules = False

data = load_data()
scores = compute_scores(data)

# Preveri -100 točk opozorila
penalty_users = [u for u, pt in scores.items() if pt <= -100]

# --- PRIJAVA IN VARNOST ---
if not st.session_state.authenticated_user:
    st.title("⚖️ Moralne Točke - Prijava")
    st.markdown("Dobrodošli! Za beleženje moralnih točk in ogled sistema se prosimo prijavite s svojim imenom in 4-mestno kodo (PIN).")
    
    with st.form("login_form"):
        col1, col2 = st.columns(2)
        with col1:
            name_input = st.text_input("Tvoje ime", placeholder="npr. Luka, Žan, Jan...")
        with col2:
            pin_input = st.text_input("4-mestni PIN", type="password", max_chars=4, placeholder="4 številke (npr. 1234)")
        
        submit_btn = st.form_submit_button("Vstopi v aplikacijo", use_container_width=True)
        
        if submit_btn:
            clean_name = name_input.strip()
            clean_pin = pin_input.strip()
            
            if not clean_name:
                st.error("Prosimo, vnesite svoje ime.")
            elif len(clean_pin) != 4 or not clean_pin.isdigit():
                st.error("PIN mora biti sestavljen iz točno 4 številk.")
            else:
                users = data.get("users", {})
                if clean_name in users:
                    if users[clean_name].get("pin") == clean_pin:
                        st.session_state.authenticated_user = clean_name
                        st.session_state.user_pin = clean_pin
                        st.success(f"Pozdravljen nazaj, {clean_name}!")
                        st.rerun()
                    else:
                        st.error("Napačen PIN za tega uporabnika!")
                else:
                    users[clean_name] = {
                        "pin": clean_pin,
                        "createdAt": datetime.now().isoformat()
                    }
                    data["users"] = users
                    save_data(data)
                    st.session_state.authenticated_user = clean_name
                    st.session_state.user_pin = clean_pin
                    st.success(f"Ustvarjen nov profil za: {clean_name}!")
                    st.rerun()
    st.stop()

# --- GLAVNI VMESNIK PO PRIJAVI ---
current_user = st.session_state.authenticated_user

# Stranska vrstica
with st.sidebar:
    st.markdown(f"### 👤 Prijavljen:")
    st.markdown(f"**{current_user}**")
    if st.button("Odjava", use_container_width=True):
        st.session_state.authenticated_user = None
        st.session_state.user_pin = None
        st.rerun()
    
    st.divider()
    st.markdown("### 📊 Hitra statistika")
    my_score = scores.get(current_user, 0)
    st.metric(label="Tvoje moralne točke", value=f"{my_score:+d}")
    st.markdown(f"Registriranih oseb: **{len(data.get('users', {}))}**")
    st.markdown(f"Število vnosov: **{len(data.get('history', []))}**")

# --- OPOZORILO: IZZIV PRI -100 TOČKAH ---
if penalty_users:
    for p_user in penalty_users:
        p_score = scores[p_user]
        st.error(
            f"""
            🚨 **POZOR! AGRESIVNO OPOZORILO ZA IZZIV!** 🚨  
            **{p_user.upper()}** ima trenutno **{p_score} točk** (dosegel ali presegel mejo -100 točk)!  
            ⚠️ **Oseba mora nemudoma opraviti predpisan izziv pred skupino!**
            """,
            icon="🚨"
        )

# Glavni naslov
st.title("⚖️ Dnevnik Moralnih Točk")
st.caption("Transparentno beleženje točk, pravil in revizijske sledi v realnem času.")

# --- PRAVILA (KRITERIJI) ---
with st.expander("📜 Kriteriji & Pravila točkovanja", expanded=True):
    col_r1, col_r2 = st.columns([4, 1])
    with col_r1:
        st.markdown("**Trenutno veljavna pravila točkovanja:**")
    with col_r2:
        if st.button("✏️ Uredi pravila" if not st.session_state.editing_rules else "Zapri urejevalnik"):
            st.session_state.editing_rules = not st.session_state.editing_rules
            st.rerun()

    if not st.session_state.editing_rules:
        # Prikaz pravil v mreži
        cols = st.columns(3)
        for i, rule in enumerate(data.get("rules", DEFAULT_RULES)):
            with cols[i % 3]:
                pts = rule.get("points", 0)
                if rule.get("isDirectChallenge"):
                    st.info(f"💥 **{rule.get('label')}**  \n*(direkten izziv!)*")
                elif pts > 0:
                    st.success(f"🟢 **{rule.get('label')}**: **+{pts}**")
                else:
                    st.warning(f"🔴 **{rule.get('label')}**: **{pts}**")
    else:
        # Urejevalnik pravil
        st.markdown("#### Urejanje pravil:")
        with st.form("edit_rules_form"):
            current_rules = data.get("rules", DEFAULT_RULES)
            updated_rules = []
            for i, r in enumerate(current_rules):
                rc1, rc2, rc3 = st.columns([3, 1, 1])
                with rc1:
                    new_lbl = st.text_input(f"Pravilo #{i+1}", value=r.get("label"), key=f"rl_{i}")
                with rc2:
                    new_pts = st.number_input(f"Točke", value=r.get("points", 0), step=5, key=f"rp_{i}")
                with rc3:
                    is_ch = st.checkbox(f"Direkt izziv", value=r.get("isDirectChallenge", False), key=f"rc_{i}")
                updated_rules.append({
                    "id": r.get("id", f"rule-{i}"),
                    "label": new_lbl,
                    "points": int(new_pts),
                    "isDirectChallenge": is_ch
                })
            
            new_r_name = st.text_input("Dodaj novo pravilo (opcijsko)", placeholder="npr. zamuda na sestanek")
            new_r_pts = st.number_input("Točke novega pravila", value=-5, step=5)
            
            save_rules_btn = st.form_submit_button("💾 Shrani posodobljena pravila")
            if save_rules_btn:
                if new_r_name.strip():
                    updated_rules.append({
                        "id": f"rule-{len(updated_rules)+1}",
                        "label": new_r_name.strip(),
                        "points": int(new_r_pts),
                        "isDirectChallenge": False
                    })
                data["rules"] = updated_rules
                data["history"].append({
                    "id": f"tx-{int(datetime.now().timestamp())}",
                    "timestamp": datetime.now().isoformat(),
                    "recordedBy": current_user,
                    "targetUser": "VSI (Pravila)",
                    "points": 0,
                    "reason": f"Urejanje pravilnika ({len(updated_rules)} pravil)"
                })
                save_data(data)
                st.session_state.editing_rules = False
                st.success("Pravila uspešno shranjena!")
                st.rerun()

st.divider()

# --- VNOSNI OBRAZEC ZA TOČKE ---
st.subheader("➕ Dodelitev točk")
all_known_users = sorted(list(set(list(data.get("users", {}).keys()) + [h.get("targetUser") for h in data.get("history", []) if h.get("targetUser")])))
if not all_known_users:
    all_known_users = [current_user]

with st.form("add_points_form", clear_on_submit=True):
    col_u1, col_u2 = st.columns(2)
    with col_u1:
        target_choice = st.selectbox("Komu dodeljuješ točke?", options=all_known_users + ["+ Dodaj novo osebo..."])
        if target_choice == "+ Dodaj novo osebo...":
            custom_target = st.text_input("Vnesi ime nove osebe:")
        else:
            custom_target = target_choice
    
    with col_u2:
        rule_options = ["(Po meri)"] + [f"{r['label']} ({'+' if r['points']>0 else ''}{r['points']})" for r in data.get("rules", [])]
        chosen_rule_str = st.selectbox("Izberi hitro pravilo (opcijsko):", options=rule_options)
    
    col_p1, col_p2 = st.columns([1, 2])
    with col_p1:
        # Če je izbrano pravilo, lahko prednastavi
        default_pts = 0
        if chosen_rule_str != "(Po meri)":
            for r in data.get("rules", []):
                if r["label"] in chosen_rule_str:
                    default_pts = r["points"]
                    break
        points_input = st.number_input("Število točk (pozitivno ali negativno)", value=default_pts, step=5)
    with col_p2:
        reason_input = st.text_input("Razlog za dodelitev", placeholder="npr. Prijazno častil kavo celi mizi")

    submit_points = st.form_submit_button("✅ Potrdi in zabeleži točke", use_container_width=True)
    if submit_points:
        final_target = (custom_target or "").strip()
        final_reason = (reason_input or "").strip()
        
        if not final_target:
            st.error("Prosimo izberite ali vnesite veljavno osebo.")
        elif not final_reason:
            st.error("Prosimo vnesite razlog za dodelitev točk.")
        else:
            # Dodaj v users če je nov
            if final_target not in data.get("users", {}):
                data.setdefault("users", {})[final_target] = {
                    "pin": "0000",
                    "createdAt": datetime.now().isoformat()
                }
            
            new_tx = {
                "id": f"tx-{int(datetime.now().timestamp())}",
                "timestamp": datetime.now().isoformat(),
                "recordedBy": current_user,
                "targetUser": final_target,
                "points": int(points_input),
                "reason": final_reason
            }
            data.setdefault("history", []).append(new_tx)
            save_data(data)
            st.success(f"Uspešno zabeleženo {points_input:+d} točk za osebo {final_target}!")
            st.rerun()

st.divider()

# --- LESTVICA IN IZZIV (-100 TOČK) ---
st.subheader("🏆 Skupna lestvica")

sorted_users = sorted(scores.items(), key=lambda x: x[1], reverse=True)

for rank, (uname, score) in enumerate(sorted_users, start=1):
    is_penalty = score <= -100
    
    if is_penalty:
        # Agresiven rdeč prikaz vrstice
        st.markdown(
            f"""
            <div style="background-color: #7f1d1d; border: 3px solid #ef4444; border-radius: 12px; padding: 16px; margin-bottom: 12px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 1.25rem; font-weight: bold;">
                        #{rank} 🚨 {uname} — SKUPAJ: <span style="font-size: 1.5rem; color: #fca5a5;">{score} točk</span>
                    </div>
                    <div style="background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold;">
                        ⚠️ IZZIV OBVEZEN (-100 točk!)
                    </div>
                </div>
                <div style="margin-top: 8px; font-size: 0.95rem; color: #fecaca;">
                    Ta oseba je dosegla ali presegla mejo -100 točk in mora opraviti izziv, da se odkupi!
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
    else:
        # Standardna vrstica lestvice
        badge = "🥇" if rank == 1 else ("🥈" if rank == 2 else ("🥉" if rank == 3 else f"#{rank}"))
        color = "#10b981" if score > 0 else ("#94a3b8" if score == 0 else "#f59e0b")
        st.markdown(
            f"""
            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 1.1rem; font-weight: 600; color: #f8fafc;">
                    {badge} {uname}
                </div>
                <div style="font-size: 1.2rem; font-weight: bold; color: {color};">
                    {score:+d} točk
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

st.divider()

# --- ZGODOVINA IN REVIZIJSKA SLED (AUDIT LOG) ---
st.subheader("📜 Zgodovina vnosov (Revizijska sled)")
history_list = list(reversed(data.get("history", [])))

if not history_list:
    st.info("Zgodovina je prazna. Bodite prvi, ki vnesete moralne točke!")
else:
    for h in history_list:
        pts = h.get("points", 0)
        pts_str = f"+{pts}" if pts > 0 else f"{pts}"
        pts_color = "🟢" if pts > 0 else ("🔴" if pts < 0 else "⚪")
        
        try:
            dt = datetime.fromisoformat(h.get("timestamp"))
            dt_str = dt.strftime("%d. %m. %Y ob %H:%M")
        except Exception:
            dt_str = h.get("timestamp", "")
            
        with st.container():
            st.markdown(
                f"""
                **{pts_color} {pts_str} točk** za **{h.get('targetUser')}**  
                *Razlog:* {h.get('reason')}  
                <small style="color: #94a3b8;">Vnesel uporabnik: <b>{h.get('recordedBy')}</b> · {dt_str}</small>
                """,
                unsafe_allow_html=True
            )
            st.divider()
