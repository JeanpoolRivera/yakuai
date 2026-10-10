/* Contenedor de toasts (aria-live). */
import { useEffect, useState } from "react";
import { Icon } from "./ui/Icon";
import type { ToastDetail } from "../lib/toast";

interface Item extends ToastDetail {
  id: number;
}

export function Toasts(): React.JSX.Element {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let id = 0;
    const timers = new Set<number>();
    const onToast = (e: Event): void => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      id += 1;
      const item: Item = { ...detail, id };
      setItems((prev) => [...prev.slice(-2), item]);
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, 3800);
      timers.add(timer);
    };
    window.addEventListener("yakuai-toast", onToast);
    return () => {
      window.removeEventListener("yakuai-toast", onToast);
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div className={`toast ${t.kind}`} key={t.id} role="status">
          <Icon name={t.kind === "ok" ? "check" : t.kind === "error" ? "alert" : "info"} size={18}/>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
