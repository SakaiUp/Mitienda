import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

// 🔥 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC6TClpmv6b4G86L1SHYE9oeQEVm6fPaVI",
  authDomain: "b3dstudio-7e3f3.firebaseapp.com",
  projectId: "b3dstudio-7e3f3",
  storageBucket: "b3dstudio-7e3f3.firebasestorage.app",
  messagingSenderId: "887745644426",
  appId: "1:887745644426:web:fd78f9d29b6acb61c5aa73",
  measurementId: "G-JECW8V3V8L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SECRET_PIN = "1234"; // 🔐 Cambia este PIN por el tuyo

const COLORS = [
  { bg: "from-pink-500 to-rose-500", light: "bg-pink-100 text-pink-700", accent: "#f43f5e" },
  { bg: "from-violet-500 to-purple-600", light: "bg-violet-100 text-violet-700", accent: "#7c3aed" },
  { bg: "from-amber-400 to-orange-500", light: "bg-amber-100 text-amber-700", accent: "#f59e0b" },
  { bg: "from-cyan-400 to-blue-500", light: "bg-cyan-100 text-cyan-700", accent: "#06b6d4" },
  { bg: "from-emerald-400 to-teal-500", light: "bg-emerald-100 text-emerald-700", accent: "#10b981" },
  { bg: "from-fuchsia-500 to-pink-600", light: "bg-fuchsia-100 text-fuchsia-700", accent: "#d946ef" },
];

export default function Catalogo() {
  const [dark, setDark] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", category: "", emoji: "🛍️", description: "", stock: "", imageUrl: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🔥 Escuchar cambios en Firestore en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const showToast = (msg, color = "#10b981") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const requirePin = (action) => {
    if (isAdmin) { runAction(action); return; }
    setPendingAction(action);
    setPinInput("");
    setPinError(false);
    setPinModal(true);
  };

  const submitPin = () => {
    if (pinInput === SECRET_PIN) {
      setIsAdmin(true);
      setPinModal(false);
      setPinError(false);
      runAction(pendingAction);
      setPendingAction(null);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const runAction = (action) => {
    if (!action) return;
    if (action === "add") {
      setEditProduct(null);
      setForm({ name: "", price: "", category: "", emoji: "🛍️", description: "", stock: "", imageUrl: "" });
      setModalOpen(true);
    } else if (action.type === "edit") {
      const p = action.p;
      setEditProduct(p);
      setForm({ name: p.name, price: p.price, category: p.category, emoji: p.emoji, description: p.description, stock: p.stock, imageUrl: p.imageUrl || "" });
      setModalOpen(true);
    } else if (action.type === "delete") {
      deleteDoc(doc(db, "productos", action.id))
        .then(() => {
          setCart(prev => prev.filter(i => i.id !== action.id));
          showToast("Producto eliminado", "#ef4444");
        })
        .catch(() => showToast("Error al eliminar", "#ef4444"));
    }
  };

  const logout = () => { setIsAdmin(false); showToast("Sesión admin cerrada 🔒", "#6b7280"); };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`¡${product.name} añadido! 🛒`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const changeQty = (id, delta) => setCart(prev =>
    prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
  );
  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const cartCount = cart.reduce((acc, i) => acc + i.qty, 0);

  // 🔥 Guardar en Firestore
  const saveProduct = async () => {
    if (!form.name || !form.price) return showToast("Completa nombre y precio", "#ef4444");
    setSaving(true);
    const data = {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      emoji: form.emoji || "🛍️",
      description: form.description,
      stock: parseInt(form.stock) || 0,
      imageUrl: form.imageUrl || "",
    };
    try {
      if (editProduct) {
        await updateDoc(doc(db, "productos", editProduct.id), data);
        showToast("¡Producto actualizado! ✏️");
      } else {
        await addDoc(collection(db, "productos"), data);
        showToast("¡Producto agregado! 🎉");
      }
      setModalOpen(false);
    } catch {
      showToast("Error al guardar. Revisa Firestore.", "#ef4444");
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const bg = dark ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900";
  const card = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100";
  const inputCls = dark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`} style={{ fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-white font-bold shadow-2xl text-sm"
          style={{ background: toast.color, animation: "slideIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 ${dark ? "bg-gray-950/90" : "bg-white/90"} backdrop-blur-md border-b ${dark ? "border-gray-800" : "border-gray-100"} px-4 py-3`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black hover:opacity-90 transition active:scale-95">
            <span className="text-lg">🛒</span>
            <span className="hidden sm:inline text-sm">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </button>

          <input
            className={`flex-1 max-w-xs px-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-400 transition ${inputCls}`}
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${dark ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-yellow-300"}`}>
              {dark ? "☀️" : "🌙"}
            </button>
            {isAdmin ? (
              <>
                <button onClick={() => requirePin("add")}
                  className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition hidden sm:block">
                  + Agregar
                </button>
                <button onClick={logout} title="Cerrar sesión admin"
                  className="w-9 h-9 rounded-xl bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition">
                  🔓
                </button>
              </>
            ) : (
              <button onClick={() => requirePin("add")} title="Acceso administrador"
                className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-violet-100 text-gray-500 hover:text-violet-600 flex items-center justify-center transition">
                🔒
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-600 via-pink-500 to-amber-400 py-8 px-4 text-white text-center">
        <h1 className="text-3xl sm:text-4xl font-black mb-1">¡Bienvenido a MiTienda! 🎉</h1>
        <p className="text-white/80 text-sm">{products.length} productos disponibles · Envíos rápidos · Calidad garantizada</p>
        {isAdmin && (
          <button onClick={() => requirePin("add")} className="mt-4 sm:hidden px-6 py-2 bg-white text-violet-600 font-black rounded-xl text-sm">
            + Agregar producto
          </button>
        )}
      </div>

      {/* Products */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-5xl animate-bounce">🔥</div>
            <p className={`mt-3 font-bold ${dark ? "text-gray-400" : "text-gray-400"}`}>Conectando con Firebase...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl">{search ? "🔍" : "📦"}</div>
            <p className={`mt-3 text-lg font-bold ${dark ? "text-gray-400" : "text-gray-400"}`}>
              {search ? `Sin resultados para "${search}"` : "No hay productos aún. ¡Agrega el primero!"}
            </p>
            {isAdmin && !search && (
              <button onClick={() => requirePin("add")}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-black rounded-xl hover:opacity-90 transition">
                + Agregar primer producto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((product, i) => {
              const color = COLORS[i % COLORS.length];
              return (
                <div key={product.id} className={`rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${card}`}>
                  <div className={`bg-gradient-to-br ${color.bg} h-44 flex items-center justify-center overflow-hidden`}>
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      : null}
                    <span className={`text-6xl ${product.imageUrl ? "hidden" : "flex"} items-center justify-center w-full h-full`}>{product.emoji || "🛍️"}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-black text-base leading-tight">{product.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${color.light}`}>{product.category}</span>
                    </div>
                    <p className={`text-xs mb-3 ${dark ? "text-gray-400" : "text-gray-500"}`}>{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-2xl" style={{ color: color.accent }}>Q{parseFloat(product.price).toFixed(2)}</span>
                      <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>Stock: {product.stock}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addToCart(product)}
                        className={`flex-1 py-2 rounded-xl text-white font-bold text-sm transition bg-gradient-to-r ${color.bg} hover:opacity-90 active:scale-95`}>
                        Agregar 🛒
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => requirePin({ type: "edit", p: product })}
                            className={`px-3 py-2 rounded-xl font-bold text-sm transition ${dark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}>✏️</button>
                          <button onClick={() => requirePin({ type: "delete", id: product.id })}
                            className="px-3 py-2 rounded-xl font-bold text-sm transition bg-red-50 hover:bg-red-100 text-red-500">🗑</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className={`w-full max-w-sm ${dark ? "bg-gray-900" : "bg-white"} h-full flex flex-col shadow-2xl`}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: dark ? "#374151" : "#f3f4f6" }}>
              <h2 className="font-black text-xl">🛒 Carrito</h2>
              <button onClick={() => setCartOpen(false)} className="text-2xl leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className={dark ? "text-gray-500" : "text-gray-400"}>Tu carrito está vacío</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${dark ? "bg-gray-800" : "bg-gray-50"}`}>
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-pink-500 font-black">Q{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center">-</button>
                    <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-sm ml-1">✕</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t" style={{ borderColor: dark ? "#374151" : "#f3f4f6" }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-lg">Total:</span>
                  <span className="font-black text-2xl text-pink-500">Q{cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => {
                  const lista = cart.map(i => `• ${i.name} x${i.qty} — Q${(i.price * i.qty).toFixed(2)}`).join("\n");
                  const mensaje = `¡Hola! Quiero hacer un pedido 🛒\n\n${lista}\n\n*Total: Q${cartTotal.toFixed(2)}*`;
                  const url = `https://wa.me/50231511875?text=${encodeURIComponent(mensaje)}`;
                  window.open(url, "_blank");
                }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-lg hover:opacity-90 transition active:scale-95">
                  Pedir por WhatsApp 💬
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {pinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPinModal(false)} />
          <div className={`relative w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center ${dark ? "bg-gray-900" : "bg-white"}`}>
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="font-black text-xl mb-1">Acceso administrador</h2>
            <p className={`text-sm mb-4 ${dark ? "text-gray-400" : "text-gray-500"}`}>Ingresa tu PIN para continuar</p>
            <input type="password" maxLength={8} placeholder="• • • •" value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={e => e.key === "Enter" && submitPin()}
              className={`w-full px-4 py-3 rounded-xl border text-center text-xl tracking-widest font-black outline-none focus:ring-2 transition mb-1 ${inputCls} ${pinError ? "border-red-400 focus:ring-red-400" : "focus:ring-violet-400"}`}
              autoFocus />
            {pinError && <p className="text-red-500 text-xs font-bold mb-2">PIN incorrecto. Inténtalo de nuevo.</p>}
            <div className="flex gap-3 mt-3">
              <button onClick={() => setPinModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${dark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}>
                Cancelar
              </button>
              <button onClick={submitPin}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition">
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl ${dark ? "bg-gray-900" : "bg-white"}`}>
            <h2 className="font-black text-xl mb-5">{editProduct ? "✏️ Editar Producto" : "🆕 Nuevo Producto"}</h2>
            <div className="space-y-3">
              {[
                { label: "Nombre", key: "name", placeholder: "Ej: Camiseta Cool", type: "text" },
                { label: "Precio ($)", key: "price", placeholder: "Ej: 29.99", type: "number" },
                { label: "Categoría", key: "category", placeholder: "Ej: Ropa, Oferta...", type: "text" },
                { label: "Emoji (si no hay foto)", key: "emoji", placeholder: "🛍️", type: "text" },
                { label: "Stock", key: "stock", placeholder: "Ej: 100", type: "number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className={`text-xs font-bold mb-1 block ${dark ? "text-gray-400" : "text-gray-500"}`}>{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-400 transition ${inputCls}`} />
                </div>
              ))}
              <div>
                <label className={`text-xs font-bold mb-1 block ${dark ? "text-gray-400" : "text-gray-500"}`}>URL de foto <span className="text-violet-400">(pega el link de Imgur)</span></label>
                <input type="text" placeholder="https://i.imgur.com/ejemplo.jpg" value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-400 transition ${inputCls}`} />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 w-full h-32 object-cover rounded-xl border" onError={e => e.target.style.display='none'} />
                )}
              </div>
              <div>
                <label className={`text-xs font-bold mb-1 block ${dark ? "text-gray-400" : "text-gray-500"}`}>Descripción</label>
                <textarea placeholder="Describe tu producto..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-400 transition resize-none h-20 ${inputCls}`} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalOpen(false)} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${dark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}>
                Cancelar
              </button>
              <button onClick={saveProduct} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition disabled:opacity-60">
                {saving ? "Guardando..." : editProduct ? "Guardar cambios" : "Agregar producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}