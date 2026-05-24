with open('c:/Users/ilham/Documents/web/ComproKesehatan/css/pages/interactive-practice.css', 'a', encoding='utf-8') as f:
    f.write("""
/* ── AR Instructions ── */
.ar-instructions {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  z-index: 100;
  pointer-events: none;
  width: 85%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: background 0.3s ease;
}

.ar-instructions.ready {
  background: rgba(43, 170, 142, 0.9);
  box-shadow: 0 4px 12px rgba(43, 170, 142, 0.4);
}
""")
