import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { TiebreakMethod } from "@/domain/types";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState } from "react";

const ALL_METHODS: Array<{ method: TiebreakMethod; label: string }> = [
  { method: "DE", label: "Encuentro Directo (ED)" },
  { method: "SB", label: "Sonneborn-Berger (SB)" },
  { method: "Buchholz", label: "Buchholz" },
  { method: "Koya", label: "Koya" },
  { method: "PN", label: "Partidas Ganadas con Negras (PN)" },
];

interface TiebreakListProps {
  order: TiebreakMethod[];
  onChange: (order: TiebreakMethod[]) => void;
}

interface RowProps {
  method: TiebreakMethod;
  label: string;
  isEnabled: boolean;
  onToggle: () => void;
  /** Render as static (no sortable hook) — used inside DragOverlay */
  static?: boolean;
}

function TiebreakRow({
  method,
  label,
  isEnabled,
  onToggle,
  static: isStatic,
}: RowProps) {
  const sortable = useSortable({
    id: method,
    disabled: !isEnabled || isStatic,
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = isStatic
    ? {
        attributes: {},
        listeners: {},
        setNodeRef: undefined,
        transform: null,
        transition: undefined,
        isDragging: false,
      }
    : sortable;

  const style = {
    transform: CSS.Transform.toString(transform ?? null),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-1.5 rounded transition-opacity ${
        isDragging ? "opacity-0" : "opacity-100"
      }`}
    >
      <button
        type="button"
        {...(isEnabled && !isStatic ? { ...attributes, ...listeners } : {})}
        aria-label={`Reordenar ${label}`}
        className={`shrink-0 rounded p-1 touch-none select-none ${
          isEnabled
            ? "cursor-grab text-muted-foreground active:cursor-grabbing"
            : "cursor-not-allowed text-muted-foreground/40"
        }`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Label htmlFor={`tb-${method}`} className="flex-1 cursor-pointer text-sm">
        {label}
      </Label>
      <Checkbox
        id={`tb-${method}`}
        checked={isEnabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}

export function TiebreakList({ order, onChange }: TiebreakListProps) {
  const enabled = new Set(order);
  const [localOrder, setLocalOrder] = useState<TiebreakMethod[]>(() => {
    const rest = ALL_METHODS.map((m) => m.method).filter(
      (m) => !order.includes(m),
    );
    return [...order, ...rest];
  });
  const [activeMethod, setActiveMethod] = useState<TiebreakMethod | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function toggle(method: TiebreakMethod) {
    if (enabled.has(method)) {
      onChange(order.filter((m) => m !== method));
    } else {
      const newEnabled = new Set([...order, method]);
      onChange(localOrder.filter((m) => newEnabled.has(m)));
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveMethod(event.active.id as TiebreakMethod);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveMethod(null);
    if (!over || active.id === over.id) return;
    const oldIndex = localOrder.indexOf(active.id as TiebreakMethod);
    const newIndex = localOrder.indexOf(over.id as TiebreakMethod);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(localOrder, oldIndex, newIndex);
    setLocalOrder(next);
    onChange(next.filter((m) => enabled.has(m)));
  }

  const displayOrder = localOrder
    .map((m) => ALL_METHODS.find((a) => a.method === m)!)
    .filter(Boolean);

  const activeItem = activeMethod
    ? (ALL_METHODS.find((a) => a.method === activeMethod) ?? null)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localOrder}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5">
          {displayOrder.map(({ method, label }) => (
            <TiebreakRow
              key={method}
              method={method}
              label={label}
              isEnabled={enabled.has(method)}
              onToggle={() => toggle(method)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="rounded-md border border-primary/40 bg-card shadow-xl ring-2 ring-primary/30 scale-[1.02]">
            <TiebreakRow
              method={activeItem.method}
              label={activeItem.label}
              isEnabled={enabled.has(activeItem.method)}
              onToggle={() => {}}
              static
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
