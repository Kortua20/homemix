---
version: 1
slug: "app-contact-page-tsx"
primary_target: "app/contact/page.tsx"
related_targets: ["components/contact-form.tsx","app/api/contact/route.ts"]
---

# Contact surface

- Scope: `/contact`, implemented by `app/contact/page.tsx`, `components/contact-form.tsx`, and `app/api/contact/route.ts`.
- Visitor mode: Operate.
- Audience: Georgian customers who need to ask about a product or contact the store.
- Job: Send a message directly, understand delivery status, and find temporary store contact information.
- Primary action: Send an inquiry directly to Home Mix through EmailJS.
- Proof and content: Required email, subject, and description fields; sending, success, error, and rate-limit feedback; clearly labeled temporary contact details and Google Maps access.
- Constraints: EmailJS credentials stay server-side; a browser may complete at most three successful sends in one 24-hour window, enforced by a signed HTTP-only cookie; failed sends do not consume allowance; successful sends clear the form; accessible labels, 44px controls, and no mobile overflow.
- Chosen direction: One practical two-column desktop layout that becomes a direct single-column form-first flow on mobile.
- Memorable moment: The message sends in place, clears on success, and states the remaining allowance without handing the visitor to another application.
- Unresolved decisions: Replace the temporary phone, address, hours, and map; stronger account-, IP-, or infrastructure-backed abuse protection can replace browser identification if required later.
