# SOKOUL — COMPONENT_RULES.md

> Rules for creating and modifying React components in Sokoul.
> Enforced by all AI agents and developers.
> Last updated: 2026-03-09

---

## Component Structure

Every component must follow this internal structure, in order:

```typescript
// 1. Imports (React, external libs, internal)
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { ContentItem } from "@/types/content"

// 2. Types / Interfaces
interface ContentCardProps {
  item: ContentItem
  onClick?: (id: string) => void
  className?: string
}

// 3. Component (named function)
function ContentCard({ item, onClick, className }: ContentCardProps) {
  // 3a. Hooks (state, effects, custom hooks)
  const [isLoaded, setIsLoaded] = useState(false)

  // 3b. Derived state / handlers
  const handleClick = () => onClick?.(item.id)

  // 3c. JSX
  return (
    <div className={className}>
      ...
    </div>
  )
}

// 4. Named export (never default export)
export { ContentCard }
```

---

## Rules

### Exports
```typescript
// ✅ Always named exports
export { ContentCard }
export { useSearchHistory }

// ❌ Never default exports
export default ContentCard
```

### Props
```typescript
// ✅ Interface for component props
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: "primary" | "ghost"
}

// ❌ No inline type or type alias for props
type ButtonProps = { label: string }
```

### Hooks order (mandatory)
```typescript
// Always in this order inside a component:
const navigate = useNavigate()          // 1. Router
const queryClient = useQueryClient()    // 2. React Query
const { data } = useMyCustomHook()      // 3. Custom hooks
const [state, setState] = useState()    // 4. Local state
useEffect(() => {}, [])                 // 5. Effects (last)
```

### Conditional rendering
```typescript
// ✅ Clean early returns
if (isLoading) return <Skeleton />
if (error) return <ErrorState />

// ❌ Avoid deeply nested ternaries
return isLoading ? <Skeleton /> : error ? <ErrorState /> : <Content />
```

### Event handlers
```typescript
// ✅ Named handlers, not inline arrows in JSX
const handlePlayPause = () => { ... }
return <button onClick={handlePlayPause} />

// ❌ No complex inline handlers
return <button onClick={() => { setPlaying(!playing); track("play") }} />
```

### Image pattern (mandatory)
```typescript
// Every image in Sokoul must follow this pattern:
function PosterImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-neutral-800">
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-800" />
      )}
      <img
        src={src}
        alt={alt}                         // ← always descriptive
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}
```

### Accessibility (mandatory per component)
```typescript
// Buttons with icon only
<button aria-label="Fermer le modal">
  <X size={16} />
</button>

// Toggle switches
<button
  role="switch"
  aria-checked={isEnabled}
  aria-label="Activer les sous-titres"
>

// Images
<img src={poster} alt={`${title} poster`} />
```

---

## File size enforcement

| Lines | Action |
|-------|--------|
| < 150 | ✅ Good |
| 150–250 | 🟡 Consider splitting |
| 250–300 | 🟠 Split sub-components |
| > 300 | 🔴 Mandatory split |

**When to split:**
- Extract repeated JSX blocks into sub-components
- Extract logic blocks into custom hooks
- Extract API calls into dedicated query files

---

## Forbidden patterns

```typescript
// ❌ Inline styles for static values
style={{ color: "#6c63ff", margin: "12px" }}

// ❌ any type
const data: any = response

// ❌ Non-null assertion without guard
const element = document.getElementById("player")!

// ❌ Direct DOM manipulation
document.querySelector(".navbar").style.opacity = "0"

// ❌ console.log in committed code
console.log("debug:", data)

// ❌ Hardcoded strings in UI
<p>Aucun résultat trouvé pour votre recherche.</p>
// → extract to constants or i18n

// ❌ Missing cleanup in useEffect
useEffect(() => {
  window.addEventListener("keydown", handler)
  // missing: return () => window.removeEventListener(...)
}, [])
```
