# User Flow

```text
Operator

  ↓
Import Excel
  ↓
Review Program
  ↓
Press Start
  ↓
Current Item
  ↓
Next
  ↓
Next
  ↓
Alert
  ↓
Finish
```

TVs update instantly.

## Detail

1. **Import Excel** — operator uploads a `.xlsx` cue sheet. Rows are parsed
   and validated (title, speaker, duration, order are required).
2. **Review Program** — operator sees the parsed list before going live and
   can fix ordering issues.
3. **Press Start** — the first item becomes Live. All connected TVs switch
   from idle state to the live layout.
4. **Current Item** — operator can advance (Next), go back (Previous), or
   jump directly to any item in the list.
5. **Alert** — operator can raise a dismissible alert (e.g. "Drama Team,
   please report Stage Left") that appears on Green Room and/or AV displays.
6. **Finish** — operator marks the program complete; TVs show an end-of-day
   state.

Every operator action propagates to all connected displays in real time —
there is no refresh, no polling delay a human would notice.
