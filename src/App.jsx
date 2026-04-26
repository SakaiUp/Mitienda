import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";

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
const SECRET_PIN = "1875";

const COLORS = [
  { accent: "#f43f5e", bg: "from-pink-500 to-rose-500" },
  { accent: "#7c3aed", bg: "from-violet-500 to-purple-600" },
  { accent: "#f59e0b", bg: "from-amber-400 to-orange-500" },
  { accent: "#06b6d4", bg: "from-cyan-400 to-blue-500" },
  { accent: "#10b981", bg: "from-emerald-400 to-teal-500" },
  { accent: "#d946ef", bg: "from-fuchsia-500 to-pink-600" },
];

export default function Catalogo() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", category: "", emoji: "🛍️", description: "", descLarga: "", dimensiones: "", tiempoEntrega: "", stock: "", imageUrl: "", foto2: "", foto3: "", foto4: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clienteNota, setClienteNota] = useState("");
  const [clienteCelular, setClienteCelular] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [acordeonDatos, setAcordeonDatos] = useState(false);
  const [acordeonPago, setAcordeonPago] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [redes, setRedes] = useState({ whatsapp: "https://wa.me/50231511875", facebook: "https://facebook.com", tiktok: "https://tiktok.com" });
  const [redesModal, setRedesModal] = useState(false);
  const [redesForm, setRedesForm] = useState({ whatsapp: "", facebook: "", tiktok: "" });
  const [qtys, setQtys] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "redes"), (snap) => {
      if (snap.exists()) setRedes(snap.data());
    });
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
      setForm({ name: "", price: "", category: "", emoji: "🛍️", description: "", descLarga: "", dimensiones: "", tiempoEntrega: "", stock: "", imageUrl: "", foto2: "", foto3: "", foto4: "" });
      setModalOpen(true);
    } else if (action.type === "edit") {
      const p = action.p;
      setEditProduct(p);
      setForm({ name: p.name, price: p.price, category: p.category, emoji: p.emoji, description: p.description, descLarga: p.descLarga || "", dimensiones: p.dimensiones || "", tiempoEntrega: p.tiempoEntrega || "", stock: p.stock, imageUrl: p.imageUrl || "", foto2: p.foto2 || "", foto3: p.foto3 || "", foto4: p.foto4 || "" });
      setModalOpen(true);
    } else if (action.type === "delete") {
      deleteDoc(doc(db, "productos", action.id))
        .then(() => { setCart(prev => prev.filter(i => i.id !== action.id)); showToast("Producto eliminado", "#ef4444"); })
        .catch(() => showToast("Error al eliminar", "#ef4444"));
    }
  };

  const logout = () => { setIsAdmin(false); showToast("Sesión admin cerrada 🔒", "#6b7280"); };
  const getQty = (id) => qtys[id] || 1;
  const changeProductQty = (id, delta) => setQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));

  const addToCart = (product) => {
    const qty = getQty(product.id);
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
    showToast(`¡${product.name} x${qty} añadido! 🛒`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const changeQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const cartCount = cart.reduce((acc, i) => acc + i.qty, 0);
  const envioGratis = cartCount >= 6;
  const descuento15 = cartCount >= 12;
  const descuentoMonto = descuento15 ? cartTotal * 0.15 : 0;
  const envio = envioGratis ? 0 : 34;
  const contraEntregaExtra = metodoPago === "Contra entrega" && !envioGratis ? 4 : 0;
  const totalFinal = cartTotal - descuentoMonto + envio + contraEntregaExtra;

  const saveProduct = async () => {
    if (!form.name || !form.price) return showToast("Completa nombre y precio", "#ef4444");
    setSaving(true);
    const data = { name: form.name, price: parseFloat(form.price), category: form.category, emoji: form.emoji || "🛍️", description: form.description, descLarga: form.descLarga || "", dimensiones: form.dimensiones || "", tiempoEntrega: form.tiempoEntrega || "", stock: parseInt(form.stock) || 0, imageUrl: form.imageUrl || "", foto2: form.foto2 || "", foto3: form.foto3 || "", foto4: form.foto4 || "" };
    try {
      if (editProduct) { await updateDoc(doc(db, "productos", editProduct.id), data); showToast("¡Producto actualizado! ✏️"); }
      else { await addDoc(collection(db, "productos"), data); showToast("¡Producto agregado! 🎉"); }
      setModalOpen(false);
    } catch { showToast("Error al guardar. Revisa Firestore.", "#ef4444"); }
    finally { setSaving(false); }
  };

  const saveRedes = async () => {
    await setDoc(doc(db, "config", "redes"), redesForm);
    showToast("¡Redes actualizadas! 🎉");
    setRedesModal(false);
  };

  const categorias = ["Todos", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = categoriaFiltro === "Todos" || p.category === categoriaFiltro;
    return matchSearch && matchCategoria;
  });

  const inputCls = "bg-gray-800 border-gray-700 text-white placeholder-gray-500";

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20" style={{ fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white font-bold shadow-2xl text-sm"
          style={{ background: toast.color, animation: "slideIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Logo + carrito */}
          <div className="flex items-center justify-between">
            <img src="https://i.imgur.com/LnBUYW8.png" alt="B3D Studio" className="h-9 object-contain" />
            <div className="flex items-center gap-2">
              {/* Barras de progreso */}
              <div className="hidden sm:flex flex-col gap-1 w-36">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-emerald-400 font-bold w-14 shrink-0">🚚 Envío</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min((cartCount / 6) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right" translate="no">{envioGratis ? "✓" : `${cartCount}/6`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-violet-400 font-bold w-14 shrink-0">🎉 15%</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-400 transition-all duration-500"
                      style={{ width: `${Math.min((cartCount / 12) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right" translate="no">{descuento15 ? "✓" : `${cartCount}/12`}</span>
                </div>
              </div>
              {isAdmin && (
                <>
                  <button onClick={() => requirePin("add")}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition">
                    + Agregar
                  </button>
                  <button onClick={logout} className="w-8 h-8 rounded-xl bg-red-900/50 text-red-400 flex items-center justify-center text-sm">🔓</button>
                </>
              )}
              {search.toLowerCase() === "admin" && !isAdmin && (
                <button onClick={() => { setSearch(""); requirePin("add"); }}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-500 to-pink-500">
                  Admin 🔐
                </button>
              )}
              <button onClick={() => setCartOpen(true)} className="relative w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition">
                <span className="text-xl">🛒</span>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-black">{cartCount}</span>}
              </button>
            </div>
          </div>
          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Barras móvil */}
          <div className="sm:hidden flex gap-3">
            <div className="flex-1 flex items-center gap-1">
              <span className="text-xs text-emerald-400 font-bold shrink-0">🚚</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${Math.min((cartCount / 6) * 100, 100)}%` }} />
              </div>
              <span className="text-xs text-gray-400" translate="no">{envioGratis ? "¡Gratis!" : `${cartCount}/6`}</span>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <span className="text-xs text-violet-400 font-bold shrink-0">🎉</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-violet-400 transition-all duration-500" style={{ width: `${Math.min((cartCount / 12) * 100, 100)}%` }} />
              </div>
              <span className="text-xs text-gray-400" translate="no">{descuento15 ? "¡Activo!" : `${cartCount}/12`}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-violet-900 via-gray-900 to-gray-950 px-4 py-5 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white font-black text-lg">Llaveros 3D personalizados</p>
            <p className="text-gray-400 text-xs mt-0.5">🚚 6 uds = Envío gratis · 🎉 12 uds = +15% desc.</p>
          </div>
          <div className="flex items-center gap-2">
            {redes.whatsapp && <a href={redes.whatsapp} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"><img src="https://i.imgur.com/uZvUAKT.png" className="w-5 h-5 object-contain" /></a>}
            {redes.facebook && <a href={redes.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"><img src="https://i.imgur.com/7QH2a3k.png" className="w-5 h-5 object-contain" /></a>}
            {redes.tiktok && <a href={redes.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"><img src="https://i.imgur.com/ueKiFWH.png" className="w-5 h-5 object-contain" /></a>}
            {isAdmin && <button onClick={() => { setRedesForm(redes); setRedesModal(true); }} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm transition">✏️</button>}
          </div>
        </div>
      </div>

      {/* Categorías */}
      {categorias.length > 1 && (
        <div className="sticky top-[120px] sm:top-[128px] z-30 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 px-4 py-2">
          <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0 ${categoriaFiltro === cat ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-5xl animate-bounce">🔥</div>
            <p className="mt-3 font-bold text-gray-400">Conectando con Firebase...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl">{search ? "🔍" : "📦"}</div>
            <p className="mt-3 text-lg font-bold text-gray-400">
              {search ? `Sin resultados para "${search}"` : "No hay productos aún."}
            </p>
            {isAdmin && !search && (
              <button onClick={() => requirePin("add")} className="mt-4 px-6 py-3 bg-violet-600 text-white font-black rounded-xl hover:opacity-90 transition">
                + Agregar primer producto
              </button>
            )}
          </div>
        ) : filtered.map((product, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={product.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-200 active:scale-98">
              <div className="flex gap-3 p-3" onClick={() => { setProductoDetalle(product); setFotoActiva(0); }}>
                {/* Foto */}
                <div className={`w-28 h-28 rounded-xl shrink-0 bg-gradient-to-br ${color.bg} flex items-center justify-center overflow-hidden`}>
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                    : <span className="text-4xl">{product.emoji || "🛍️"}</span>}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0 py-1">
                  <span className="text-xs text-violet-400 font-bold">{product.category}</span>
                  <h3 className="font-black text-sm leading-tight mt-0.5 mb-1">{product.name}</h3>
                  {product.description && <p className="text-xs text-gray-400 line-clamp-2 mb-2">{product.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg" style={{ color: color.accent }} translate="no">Q{parseFloat(product.price).toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                  </div>
                </div>
              </div>
              {/* Acciones */}
              <div className={`flex items-center gap-2 px-3 pb-3`}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800`}>
                  <button onClick={() => changeProductQty(product.id, -1)} className="text-gray-400 hover:text-white font-black text-lg leading-none">−</button>
                  <span className="font-black text-sm w-5 text-center" translate="no">{getQty(product.id)}</span>
                  <button onClick={() => changeProductQty(product.id, 1)} className="text-gray-400 hover:text-white font-black text-lg leading-none">+</button>
                </div>
                <button onClick={() => addToCart(product)}
                  className={`flex-1 py-2 rounded-xl text-white font-black text-sm bg-gradient-to-r ${color.bg} hover:opacity-90 active:scale-95 transition`}>
                  Agregar 🛒
                </button>
                {isAdmin && (
                  <>
                    <button onClick={() => requirePin({ type: "edit", p: product })} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm transition">✏️</button>
                    <button onClick={() => requirePin({ type: "delete", id: product.id })} className="w-9 h-9 rounded-xl bg-red-900/40 hover:bg-red-900/60 text-red-400 flex items-center justify-center text-sm transition">🗑</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-800 px-6 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <button className="flex flex-col items-center gap-0.5 text-violet-400">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-bold">Inicio</span>
          </button>
          <button onClick={() => setCategoriaFiltro("Todos")} className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-300 transition">
            <span className="text-xl">📦</span>
            <span className="text-xs font-bold">Categorías</span>
          </button>
          <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-300 transition">
            <span className="text-xl">🛒</span>
            <span className="text-xs font-bold">Carrito</span>
            {cartCount > 0 && <span className="absolute -top-1 right-2 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">{cartCount}</span>}
          </button>
          <button onClick={() => redes.whatsapp && window.open(redes.whatsapp, "_blank")} className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-300 transition">
            <span className="text-xl">💬</span>
            <span className="text-xs font-bold">Contacto</span>
          </button>
        </div>
      </nav>

      {/* Página de detalle */}
      {productoDetalle && (() => {
        const p = productoDetalle;
        const fotos = [p.imageUrl, p.foto2, p.foto3, p.foto4].filter(Boolean);
        const color = COLORS[products.indexOf(p) % COLORS.length] || COLORS[0];
        return (
          <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-gray-950/95 backdrop-blur-md border-b border-gray-800">
              <button onClick={() => setProductoDetalle(null)} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition text-lg">←</button>
              <h2 className="font-black text-base truncate flex-1">{p.name}</h2>
              <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
                🛒
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">{cartCount}</span>}
              </button>
            </div>

            <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-4 pb-24">
              <div className={`bg-gradient-to-br ${color.bg} rounded-2xl overflow-hidden h-64 sm:h-96 flex items-center justify-center`}>
                {fotos.length > 0
                  ? <img src={fotos[fotoActiva]} alt={p.name} className="w-full h-full object-contain" />
                  : <span className="text-8xl">{p.emoji || "🛍️"}</span>}
              </div>
              {fotos.length > 1 && (
                <div className="flex gap-2">
                  {fotos.map((f, i) => (
                    <button key={i} onClick={() => setFotoActiva(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${fotoActiva === i ? "border-violet-500" : "border-gray-700"}`}>
                      <img src={f} alt="" className="w-full h-full object-contain bg-gray-800" />
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="flex items-start justify-between mb-1">
                  <h1 className="font-black text-xl">{p.name}</h1>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-violet-900/50 text-violet-400 ml-2 shrink-0">{p.category}</span>
                </div>
                <p className="font-black text-3xl mb-3" style={{ color: color.accent }} translate="no">Q{parseFloat(p.price).toFixed(2)}</p>
                {p.description && <p className="text-sm text-gray-400 mb-2">{p.description}</p>}
                {p.descLarga && <p className="text-sm text-gray-300 mb-3">{p.descLarga}</p>}
                <div className="space-y-2 mb-4">
                  {p.dimensiones && <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-gray-800"><span>📐</span><span className="font-bold">Dimensiones:</span><span className="text-gray-400">{p.dimensiones}</span></div>}
                  {p.tiempoEntrega && <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-gray-800"><span>⏱️</span><span className="font-bold">Tiempo de entrega:</span><span className="text-gray-400">{p.tiempoEntrega}</span></div>}
                  <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-gray-800"><span>📦</span><span className="font-bold">Stock:</span><span className="text-gray-400">{p.stock} disponibles</span></div>
                </div>
                <div className="rounded-xl p-3 mb-4 bg-gray-800 space-y-1">
                  <p className="text-emerald-400 font-bold text-sm">🚚 6 unidades: Envío gratis</p>
                  <p className="text-violet-400 font-bold text-sm">🎉 12 unidades: Envío gratis + 15% descuento</p>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-800 mb-3">
                  <span className="text-sm font-bold text-gray-400">Cantidad:</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => changeProductQty(p.id, -1)} className="w-8 h-8 rounded-xl bg-gray-700 hover:bg-gray-600 font-black flex items-center justify-center">−</button>
                    <span className="font-black text-lg w-8 text-center">{getQty(p.id)}</span>
                    <button onClick={() => changeProductQty(p.id, 1)} className="w-8 h-8 rounded-xl bg-gray-700 hover:bg-gray-600 font-black flex items-center justify-center">+</button>
                  </div>
                </div>
                <button onClick={() => { addToCart(p); setProductoDetalle(null); }}
                  className={`w-full py-3 rounded-xl text-white font-black text-lg bg-gradient-to-r ${color.bg} hover:opacity-90 active:scale-95 transition`}>
                  Agregar al carrito 🛒
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Carrito */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-gray-900 h-full flex flex-col shadow-2xl border-l border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="font-black text-xl">🛒 Carrito</h2>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="text-gray-500">Tu carrito está vacío</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-800">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-700 flex items-center justify-center">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" /> : <span className="text-3xl">{item.emoji || "🛍️"}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm leading-tight mb-0.5">{item.name}</p>
                    <p className="text-pink-400 font-black text-base" translate="no">Q{(item.price * item.qty).toFixed(2)}</p>
                    <p className="text-gray-500 text-xs" translate="no">Q{parseFloat(item.price).toFixed(2)} c/u</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 rounded-xl bg-gray-700 hover:bg-gray-600 font-black text-sm flex items-center justify-center">+</button>
                    <span className="font-black text-base" translate="no">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 rounded-xl bg-gray-700 hover:bg-gray-600 font-black text-sm flex items-center justify-center">−</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-lg ml-1 shrink-0">✕</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-800 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal:</span><span className="font-bold" translate="no">Q{cartTotal.toFixed(2)}</span></div>
                  {descuento15 && <div className="flex justify-between text-sm"><span className="text-violet-400 font-bold">🎉 Descuento 15%:</span><span className="text-violet-400 font-bold" translate="no">-Q{descuentoMonto.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-sm">
                    <span className={envioGratis ? "text-emerald-400 font-bold" : "text-gray-400"}>🚚 Envío:</span>
                    <span className={envioGratis ? "text-emerald-400 font-bold" : "font-bold"} translate="no">{envioGratis ? "¡Gratis!" : "Q34.00"}</span>
                  </div>
                  {contraEntregaExtra > 0 && <div className="flex justify-between text-sm"><span className="text-amber-400 font-bold">Cargo contra entrega:</span><span className="text-amber-400 font-bold" translate="no">+Q4.00</span></div>}
                  {!envioGratis && <p className="text-xs text-amber-400 font-bold text-center">Agrega {6 - cartCount} más para envío gratis 🚚</p>}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="font-black text-lg">Total:</span>
                    <span className="font-black text-2xl text-pink-400" translate="no">Q{totalFinal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Acordeón datos */}
                <div className="rounded-2xl border border-gray-700 overflow-hidden">
                  <button onClick={() => setAcordeonDatos(!acordeonDatos)}
                    className="w-full flex items-center justify-between px-4 py-3 font-black text-sm bg-gray-800 hover:bg-gray-700 transition">
                    <span>📦 Datos de envío {clienteNombre && clienteCelular && clienteDireccion ? "✅" : <span className="text-red-400">*obligatorio</span>}</span>
                    <span>{acordeonDatos ? "▲" : "▼"}</span>
                  </button>
                  {acordeonDatos && (
                    <div className="p-3 space-y-2 bg-gray-800/50">
                      <input type="text" placeholder="👤 Tu nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls} ${!clienteNombre ? "border-red-500" : "border-gray-700"}`} />
                      <input type="tel" placeholder="📱 Número de celular" value={clienteCelular} onChange={e => setClienteCelular(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls} ${!clienteCelular ? "border-red-500" : "border-gray-700"}`} />
                      <input type="text" placeholder="📍 Dirección de entrega" value={clienteDireccion} onChange={e => setClienteDireccion(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls} ${!clienteDireccion ? "border-red-500" : "border-gray-700"}`} />
                      <textarea placeholder="📝 Nota (opcional)" value={clienteNota} onChange={e => setClienteNota(e.target.value)} className={`w-full px-3 py-2 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition resize-none h-16 ${inputCls}`} />
                    </div>
                  )}
                </div>

                {/* Acordeón pago */}
                <div className="rounded-2xl border border-gray-700 overflow-hidden">
                  <button onClick={() => setAcordeonPago(!acordeonPago)}
                    className="w-full flex items-center justify-between px-4 py-3 font-black text-sm bg-gray-800 hover:bg-gray-700 transition">
                    <span>💳 {metodoPago || <span className="text-red-400">Método de pago *obligatorio</span>} {metodoPago ? "✅" : ""}</span>
                    <span>{acordeonPago ? "▲" : "▼"}</span>
                  </button>
                  {acordeonPago && (
                    <div className="p-3 space-y-1 bg-gray-800/50">
                      {[
                        { id: "Transferencia / App bancaria (BAC, BI, Banrural)", label: "🏦 Transferencia / App bancaria", sub: "BAC, BI, Banrural" },
                        { id: "Depósito en banco", label: "🏧 Depósito en banco", sub: "" },
                        { id: "Zigi", label: "⚡ Zigi", sub: "QR o link" },
                        { id: "Contra entrega", label: "🚚 Contra entrega", sub: !envioGratis ? "+Q4.00" : "Sin recargo" },
                      ].map(op => (
                        <button key={op.id} onClick={() => { setMetodoPago(op.id); setAcordeonPago(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-bold transition ${metodoPago === op.id ? "border-violet-500 bg-violet-900/30 text-violet-400" : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"}`}>
                          <span>{op.label}</span>
                          {op.sub && <span className={`text-xs font-normal ${op.id === "Contra entrega" && !envioGratis ? "text-amber-400 font-bold" : "text-gray-500"}`}>{op.sub}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => {
                  if (!clienteNombre || !clienteDireccion || !clienteCelular) { setAcordeonDatos(true); return showToast("Completa los datos de envío", "#ef4444"); }
                  if (!metodoPago) { setAcordeonPago(true); return showToast("Selecciona un método de pago", "#ef4444"); }
                  const lista = cart.map(i => `• ${i.name} x${i.qty} — Q${(i.price * i.qty).toFixed(2)}`).join("\n");
                  const extras = `${descuento15 ? `\n🎉 Descuento 15%: -Q${descuentoMonto.toFixed(2)}` : ""}\n${envioGratis ? "🚚 Envío: Gratis" : "🚚 Envío: Q34.00"}${contraEntregaExtra > 0 ? "\n🚚 Cargo contra entrega: +Q4.00" : ""}`;
                  const datosCliente = `\n\n👤 Nombre: ${clienteNombre}\n📱 Celular: ${clienteCelular}\n📍 Dirección: ${clienteDireccion}\n💳 Pago: ${metodoPago}${clienteNota ? `\n📝 Nota: ${clienteNota}` : ""}`;
                  const mensaje = `¡Hola! Quiero hacer un pedido 🛒\n\n${lista}${extras}\n\n*Total: Q${totalFinal.toFixed(2)}*${datosCliente}`;
                  window.open(`https://wa.me/50231511875?text=${encodeURIComponent(mensaje)}`, "_blank");
                }} className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-lg hover:opacity-90 transition active:scale-95">
                  Pedir por WhatsApp 💬
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Redes */}
      {redesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRedesModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl bg-gray-900 border border-gray-800">
            <h2 className="font-black text-xl mb-5">📱 Editar Redes Sociales</h2>
            <div className="space-y-3">
              {[{ key: "whatsapp", label: "WhatsApp", icon: "https://i.imgur.com/uZvUAKT.png", placeholder: "https://wa.me/502..." },
                { key: "facebook", label: "Facebook", icon: "https://i.imgur.com/7QH2a3k.png", placeholder: "https://facebook.com/tupagina" },
                { key: "tiktok", label: "TikTok", icon: "https://i.imgur.com/ueKiFWH.png", placeholder: "https://tiktok.com/@tuusuario" }
              ].map(({ key, label, icon, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold mb-1 flex items-center gap-2 text-gray-400"><img src={icon} className="w-4 h-4" />{label}</label>
                  <input type="text" placeholder={placeholder} value={redesForm[key] || ""}
                    onChange={e => setRedesForm(f => ({ ...f, [key]: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls}`} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRedesModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 transition">Cancelar</button>
              <button onClick={saveRedes} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {pinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPinModal(false)} />
          <div className="relative w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center bg-gray-900 border border-gray-800">
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="font-black text-xl mb-1">Acceso administrador</h2>
            <p className="text-sm mb-4 text-gray-400">Ingresa tu PIN para continuar</p>
            <input type="password" maxLength={8} placeholder="• • • •" value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={e => e.key === "Enter" && submitPin()}
              className={`w-full px-4 py-3 rounded-xl border text-center text-xl tracking-widest font-black outline-none focus:ring-2 transition mb-1 bg-gray-800 text-white placeholder-gray-600 ${pinError ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-violet-500"}`}
              autoFocus />
            {pinError && <p className="text-red-400 text-xs font-bold mb-2">PIN incorrecto.</p>}
            <div className="flex gap-3 mt-3">
              <button onClick={() => setPinModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 transition">Cancelar</button>
              <button onClick={submitPin} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition">Entrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl bg-gray-900 border border-gray-800 max-h-screen overflow-y-auto">
            <h2 className="font-black text-xl mb-5">{editProduct ? "✏️ Editar Producto" : "🆕 Nuevo Producto"}</h2>
            <div className="space-y-3">
              {[
                { label: "Nombre", key: "name", placeholder: "Ej: Llavero Galaxia", type: "text" },
                { label: "Precio (Q)", key: "price", placeholder: "Ej: 29.99", type: "number" },
                { label: "Categoría", key: "category", placeholder: "Ej: Animales, Series...", type: "text" },
                { label: "Emoji (si no hay foto)", key: "emoji", placeholder: "🛍️", type: "text" },
                { label: "Stock", key: "stock", placeholder: "Ej: 100", type: "number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-bold mb-1 block text-gray-400">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls}`} />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold mb-1 block text-gray-400">URL foto principal <span className="text-violet-400">(Imgur)</span></label>
                <input type="text" placeholder="https://i.imgur.com/ejemplo.jpg" value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls}`} />
                {form.imageUrl && <img src={form.imageUrl} alt="preview" className="mt-2 w-full h-32 object-contain rounded-xl border border-gray-700 bg-gray-800" onError={e => e.target.style.display = 'none'} />}
              </div>
              {["foto2", "foto3", "foto4"].map((key, i) => (
                <div key={key}>
                  <label className="text-xs font-bold mb-1 block text-gray-400">URL foto extra {i + 2} <span className="text-gray-500">(opcional)</span></label>
                  <input type="text" placeholder="https://i.imgur.com/ejemplo.jpg" value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls}`} />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold mb-1 block text-gray-400">Descripción corta</label>
                <textarea placeholder="Resumen breve..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition resize-none h-16 ${inputCls}`} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block text-gray-400">Descripción larga <span className="text-gray-500">(colores, material...)</span></label>
                <textarea placeholder="Descripción detallada..." value={form.descLarga} onChange={e => setForm(f => ({ ...f, descLarga: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition resize-none h-24 ${inputCls}`} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block text-gray-400">Dimensiones</label>
                <input type="text" placeholder="Ej: 5cm x 3cm" value={form.dimensiones} onChange={e => setForm(f => ({ ...f, dimensiones: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls}`} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block text-gray-400">Tiempo de entrega</label>
                <input type="text" placeholder="Ej: 3-5 días hábiles" value={form.tiempoEntrega} onChange={e => setForm(f => ({ ...f, tiempoEntrega: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition ${inputCls}`} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 transition">Cancelar</button>
              <button onClick={saveProduct} disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition disabled:opacity-60">
                {saving ? "Guardando..." : editProduct ? "Guardar cambios" : "Agregar producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
