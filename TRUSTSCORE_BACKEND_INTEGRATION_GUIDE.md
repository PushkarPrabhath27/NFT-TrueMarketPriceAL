# TrustScore Project: Backend Integration, Testing, and Full-Stack Roadmap

## Project Goal
Your task is to help develop a robust, maintainable, and extensible TrustScore system. The core objective is to enable secure, transparent swaps between two tokens using a nano contract, track participant trust scores, and provide reliable backend APIs (and optionally a frontend) for interacting with the contract. Automated testing is essential to ensure reliability and catch regressions.

---

## 1. Understanding the Workspace Structure
- **Backend:**
  - Main backend logic and API endpoints are in `src/trust_score/api/` and possibly `src/api/`.
  - Contract code is in `src/trust_score/contracts/` (e.g., `trust_score_blueprint.py`).
- **Testing:**
  - Automated tests are in `src/api/tests/` (TypeScript/Jest) and/or `src/trust_score/tests/` (Python/pytest).
- **Frontend (Optional):**
  - UI code is in the `frontend/` directory (React/TypeScript).

---

## 2. Step-by-Step Backend Integration
### 2.1. Analyze the Contract
- Review `trust_score_blueprint.py` for public/view methods:
  - `initialize(ctx, token_a, token_b, multiplier_a, multiplier_b)`
  - `swap(ctx)`
  - `get_state()`

### 2.2. Create/Update Backend Service Module
- **Location:** `src/trust_score/api/services/contractService.py` (or `.ts` if using TypeScript)
- **Responsibilities:**
  - Provide functions to call contract methods (`initialize`, `swap`, `get_state`).
  - Handle contract deployment, state management, and error handling.
  - Example function signatures:
    - `def initialize_contract(token_a, token_b, multiplier_a, multiplier_b): ...`
    - `def perform_swap(...): ...`
    - `def fetch_contract_state(): ...`

### 2.3. Expose REST API Endpoints
- **Location:** `src/trust_score/api/routes/` or `src/api/routes/`
- **Endpoints to Implement:**
  - `POST /api/contract/initialize` → Calls `initialize`
  - `POST /api/contract/swap` → Calls `swap`
  - `GET /api/contract/state` → Calls `get_state`
- **How:**
  - Use your backend framework (e.g., FastAPI, Flask, Express) to define these routes.
  - Each route should validate input, call the service function, and return JSON responses.

### 2.4. Connect Everything in `index.ts` or Main App File
- Import your contract service and routes.
- Register routes with the main app/server instance.
- Ensure error handling middleware is in place.

---

## 3. Automated Testing
### 3.1. Organize Test Files
- **Location:**
  - Python: `src/trust_score/tests/test_contract.py`
  - TypeScript: `src/api/tests/contract.test.ts`

### 3.2. Write Test Cases
- **Test Each Contract Method:**
  - `initialize`: Test with valid and invalid tokens/multipliers.
  - `swap`: Test valid swaps, invalid actions, wrong ratios, etc.
  - `get_state`: Test state after various operations.
- **Edge Cases:**
  - Attempt to swap with uninitialized contract.
  - Invalid token pairs.
  - Negative or zero multipliers.
- **Example (Python/pytest):**
  ```python
  def test_initialize_valid():
      ...
  def test_initialize_invalid_tokens():
      ...
  def test_swap_success():
      ...
  def test_swap_invalid_ratio():
      ...
  ```
- **Example (TypeScript/Jest):**
  ```ts
  test('initialize with valid params', async () => { ... });
  test('swap fails with wrong ratio', async () => { ... });
  ```

### 3.3. Run Tests Frequently
- Python: `pytest src/trust_score/tests/`
- TypeScript: `npm run test` (ensure jest is configured)

---

## 4. (Optional) Frontend Integration
- **Location:** `frontend/src/pages/`, `frontend/src/components/`
- **Tasks:**
  - Build pages/components to call backend endpoints (`/api/contract/state`, `/api/contract/swap`, etc.).
  - Display contract state, allow users to initiate swaps.
  - Use fetch/axios to connect frontend to backend.

---

## 5. Best Practices & Tips
- **Modularity:** Keep contract logic, API routes, and tests in separate modules.
- **Naming:** Use clear, descriptive names for files, functions, and variables.
- **Error Handling:** Always handle exceptions and return meaningful error messages.
- **Documentation:** Add docstrings/comments to explain complex logic.
- **Version Control:** Commit changes frequently with clear messages.
- **Testing:** Cover both success and failure cases. Use fixtures/mocks for setup.

---

## 6. Summary Table
| Task                | Where to Work                | What to Do                                              |
|---------------------|-----------------------------|---------------------------------------------------------|
| Backend Integration | src/api, src/trust_score/api| Add contract calls, REST endpoints                      |
| Automated Testing   | src/api/tests, trust_score/tests | Write tests for contract methods                        |
| Frontend (Optional) | frontend/src/pages, components| Build UI to call backend and show contract state        |

---

## 7. If You’re Stuck
- Start with one simple test (e.g., test `initialize` with valid/invalid input).
- Gradually add more tests for each contract method.
- Use print/log statements to debug.
- Ask for help or consult documentation if needed.

---

## 8. Checklist for Each Task
- [ ] Analyze the contract and understand all methods.
- [ ] Implement backend service functions for contract interaction.
- [ ] Expose REST API endpoints for each contract method.
- [ ] Write and organize automated tests for all scenarios.
- [ ] (Optional) Build frontend pages/components to interact with backend.
- [ ] Document your code and process.
- [ ] Run all tests and ensure they pass before deploying or merging changes.

---

## 9. Example Directory Structure
```
NFT_TrustScore/
├── src/
│   ├── trust_score/
│   │   ├── contracts/
│   │   │   └── trust_score_blueprint.py
│   │   ├── api/
│   │   │   ├── services/
│   │   │   │   └── contractService.py
│   │   │   ├── routes/
│   │   │   │   └── contractRoutes.py
│   │   │   └── ...
│   │   └── tests/
│   │       └── test_contract.py
│   └── api/
│       └── tests/
│           └── contract.test.ts
├── frontend/
│   └── src/
│       └── pages/
│       └── components/
└── TRUSTSCORE_BACKEND_INTEGRATION_GUIDE.md
```

---

## 10. Final Notes
- Always align your implementation with the project’s goals.
- Break down complex tasks into smaller, manageable steps.
- Write clean, modular, and well-documented code.
- Test thoroughly and iterate based on results.
- Don’t hesitate to ask for clarification or help if you’re unsure about any step.

---

**You now have a detailed, actionable roadmap for integrating, testing, and extending your TrustScore backend (and optionally frontend) in a professional, maintainable way.**