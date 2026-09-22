import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('conversation drawer contract', () => {
  it('keeps the drawer closed until the scene trigger is activated', () => {
    expect(app).toContain("const [drawerOpen, setDrawerOpen] = useState(false)");
    expect(app).toContain('onClick={openDrawer}');
    expect(app).toContain('{drawerOpen &&');
  });
  it('keeps cancellation tied to submission and press-to-talk, not opening', () => {
    expect(app).toContain("cancel('thinking')");
    expect(app).toContain("cancel('listening')");
    expect(app).not.toContain('const openDrawer = () => { cancel');
  });
  it('restores focus after the drawer closes', () => {
    expect(app).toContain('triggerRef.current?.focus()');
  });
});
