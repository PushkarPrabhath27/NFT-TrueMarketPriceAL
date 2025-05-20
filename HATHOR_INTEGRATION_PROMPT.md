Hathor Blockchain Integration Prompt for NFT Analytics Platform
Objective
Replace all mock data in the NFT analytics platform with real-time data from Hathor's blockchain, enabling live trust score, price intelligence, risk assessment, collection and creator analysis, market analysis, and portfolio features for any NFT specified by the user. When a user inputs a specific NFT identifier, ALL platform features and visualizations must immediately update to reflect the actual data for that particular NFT.

Step-by-Step Integration Plan
1. Identify and Replace Mock Data

Audit the Codebase:

Search for all instances where mock data is used for NFT analytics (trust score, price, risk, collection, creator, market, portfolio).
Document each location/component using mock data (e.g., PricePrediction.tsx, MarketSegments.tsx, etc.).


Replace with Real Data:

For each mock data instance, replace with a function or API call that fetches real-time data from Hathor's blockchain.
Use Hathor's official SDK, REST API, or GraphQL endpoints as appropriate.
Ensure all data fetching is asynchronous and handles loading/error states.
Create data mapping functions to transform blockchain data into the exact format expected by each component.



2. Implement NFT User Input/Search Feature

UI Update:

Add a prominent user input field (search bar, dropdown, or modal) allowing users to specify or search for any NFT by token ID, name, or collection.
Ensure the input is accessible and mobile-friendly.
Add autocomplete suggestions based on popular or recently viewed NFTs.


Data Fetch Trigger:

On user input, trigger a fetch for all relevant NFT analytics from Hathor's blockchain.
Pass the NFT identifier to all analytics components (trust score, price, risk, etc.).
Create a global state management solution (Redux, Context API) to ensure the selected NFT data is accessible throughout the application.



3. Dynamic Analytics and Visualization - Complete Feature Reflection

Comprehensive Data Update:

Implement a central data orchestration service that coordinates updates to ALL platform features.
Ensure every single platform feature (no exceptions) updates to reflect the specific selected NFT:

Trust Score: Display the actual trust metrics for the selected NFT
Price Intelligence: Show real price history, predictions, and comparisons for the specific NFT
Risk Assessment: Calculate and display actual risk factors for the selected NFT
Collection Analysis: Show real collection metrics that include the selected NFT
Creator Analysis: Display actual creator history and performance related to the selected NFT
Market Analysis: Update all charts and metrics to reflect the selected NFT's market position
Portfolio Features: Highlight the selected NFT within portfolio context if applicable


Create synchronization mechanisms to ensure all components update simultaneously.


Visual Confirmation of NFT Selection:

Add visual indicators throughout the UI showing which NFT is currently selected.
Implement a "currently viewing" banner or header that displays the selected NFT's key details.
Ensure page title and URL updates to reflect the current NFT for sharing/bookmarking.


Loading and Error Handling:

Show consistent loading indicators across all components while fetching data.
Implement staged loading to prioritize critical information first.
Display user-friendly error messages if data cannot be retrieved or NFT is not found.
Provide fallback displays that clearly indicate when data is unavailable for specific metrics.



4. Hathor Blockchain Integration

API/SDK Integration:

Integrate with Hathor's blockchain using their SDK or API.
Create specialized data retrieval functions for each analytics category.
Authenticate and handle rate limits as required.
Parse and normalize blockchain data to fit the analytics components' needs.
Implement WebSocket connections for real-time updates when possible.


Data Transformation Layer:

Build a transformation layer that converts raw blockchain data into the exact format required by each feature.
Ensure consistent data normalization across all features for unified presentation.
Create calculated fields derived from blockchain data to power advanced analytics features.


Security and Performance:

Sanitize all user inputs to prevent injection attacks.
Cache results where possible to reduce redundant blockchain queries.
Implement progressive loading for data-heavy features.
Optimize for minimal latency and efficient data usage.



5. Cohesive User Experience

Feature Interconnection:

Enable cross-feature navigation based on selected NFT (e.g., clicking on a collection metric navigates to collection view for that NFT).
Implement breadcrumb navigation showing relationship between selected NFT and displayed data.
Allow users to compare the selected NFT with others via a comparison tool.


Persistence of Selection:

Save user's selected NFT in session/local storage to maintain selection on page refresh.
Create a "recently viewed" list to allow quick access to previously analyzed NFTs.
Enable URL parameter-based navigation to specific NFTs for sharing.



6. Testing and Validation

Unit and Integration Tests:

Write tests for all data fetching and parsing logic.
Create test cases for various NFT types and edge cases.
Mock Hathor API responses for test reliability.
Verify that all features update correctly when NFT selection changes.


End-to-End Testing:

Create automated tests that validate the full user flow from NFT selection to all features updating.
Test synchronization between features to ensure consistent data presentation.


User Acceptance Testing:

Validate that analytics update correctly for various NFTs.
Ensure UI/UX is smooth and responsive.
Gather feedback on the relevance and accuracy of displayed data.



7. Documentation and Maintenance

Code Comments:

Document all new functions, API calls, and integration logic.
Note component dependencies and data flow paths.


README Update:

Add a section to the project README describing the Hathor integration, setup steps, and troubleshooting tips.
Include examples of how to test with specific NFTs.


Future-Proofing:

Abstract blockchain logic to allow for future support of other chains if needed.
Create an extensible architecture for adding new analytics features.




Example Prompt for AI Agent

Replace all mock data in the NFT analytics platform with real-time data from Hathor's blockchain. For each analytics feature (trust score, price intelligence, risk assessment, collection/creator analysis, market analysis, portfolio), identify where mock data is used and replace it with live data fetched from Hathor. Implement a user input/search feature to allow users to specify any NFT, and ensure ALL platform features update dynamically to reflect the SPECIFIC selected NFT's actual data. When a user selects an NFT, every single component and visualization must update to show real data for that exact NFT - no feature should continue displaying generic or unrelated information. Integrate with Hathor's blockchain using their SDK or API, handle errors and loading states gracefully, and optimize for performance and security. Create a consistent, interconnected experience where the selected NFT remains the focal point across all platform features. Document all changes and update the README with integration instructions.

---

## References
- [Hathor Developer Docs](https://docs.hathor.network/)
- [Hathor SDK (npm)](https://www.npmjs.com/package/@hathor/wallet-lib)
- [Hathor REST API](https://docs.hathor.network/api/)