# VDNet Design Reference

Reference site: `https://slaglab.com/`

The implementation should reference product structure and interaction patterns,
not copy protected assets, logos, exact copy, pricing text, videos, or source
code.

## Extracted Public Design Patterns

- Fixed translucent header and white-blue technical brand language.
- Centered hero with a strong product title and two named core technologies.
- Product demo presented through a phone-frame preview.
- Segmented tabs for product/platform modes.
- Feature cards with compact icon marks, short titles, and one-sentence value.
- Pricing/contact sections organized as lightweight cards.
- Palette direction: navy text, bright blue accent, pale blue page wash, white
  cards, thin blue borders, soft blue shadows.

## VDNet Adaptation

- Keep the VDNet name and vdnet.top domains.
- Use `SlagCore` and `SlagPulse` only as VDNet product module names from the
  user's requested architecture.
- Keep PPANEL as the first adapter, with V2Board/XBoard/SSP in the architecture
  backlog.
- Replace web landing-page pricing with app-native account, connection, node,
  invite, traffic, ticket, and profile surfaces.
- Keep the Expo version as a UI and integration preview. Native VPN capability
  still requires Android `VpnService`, iOS `NetworkExtension`, and a Rust bridge.

## Current UI Changes

- Login now starts with a product showcase section.
- The app uses a blue-white product palette through `src/theme/brand.ts`.
- Email and phone entry modes are visible in the login flow.
- The home page surfaces the product showcase and SlagCore runtime state.
