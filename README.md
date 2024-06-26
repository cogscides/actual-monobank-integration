🚧 WIP repository. 🌠 Unstable

# Monobank to Actual Finance Sync

This is a Node.js application that syncs your Monobank transactions to your self-hosted Actual Finance service. It provides a seamless integration between the two platforms, allowing you to manage your finances more effectively.

## Features

- Automatically fetches transactions from Monobank and imports them into Actual Finance
- Supports multiple Monobank accounts and maps them to specific Actual Finance accounts
- Handles rate limiting and retries to ensure reliable data transfer
- Provides detailed transaction notes, including MCC codes, counter information, and more
- Runs as a continuous process, syncing transactions at a configurable interval

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- Actual Finance server (version 1.x or higher)
- Monobank API token

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/actual-monobank-integration.git actual-monobank-integration
```

2. Install the dependencies:

```bash
cd actual-monobank-integration
npm install
```

3. Create a `.env` file based on the `.env.example` file and fill in the required information:

```
ACTUAL_DATA_DIR=/path/to/actual/data
ACTUAL_SERVER_URL=http://localhost:5006
ACTUAL_PASSWORD=your_actual_password
ACTUAL_BUDGET_ID=your_budget_id
ACTUAL_BUDGET_ENCRYPTED_PASSWORD=your_budget_encrypted_password
MONOBANK_TOKEN=your_monobank_token
SYNC_INTERVAL=3600000
# Monobank to Actual account mappings
# Format: MONO*TO_ACTUAL_MAPPING_<monobank_account_last_4_digits>=<actual_account_name>
# Example: MONO_TO_ACTUAL_MAPPING_1234=My Actual Account
MONO_TO_ACTUAL_FOR_ALL=false
```

4. Start the application:

```bash
npm start
```

The application will now start syncing your Monobank transactions to Actual Finance. It will run continuously, syncing transactions at the specified interval.

## **TODO: Add initial account setup instructions**

## Configuration

The application can be configured using the `.env` file. The available options are:

- `ACTUAL_DATA_DIR`: The directory where Actual Finance data will be stored.
- `ACTUAL_SERVER_URL`: The URL of your Actual Finance server.
- `ACTUAL_PASSWORD`: The password for your Actual Finance server.
- `ACTUAL_BUDGET_ID`: The ID of the Actual Finance budget to use.
- `ACTUAL_BUDGET_ENCRYPTED_PASSWORD`: The encrypted password for the Actual Finance budget (if applicable).
- `MONOBANK_TOKEN`: Your Monobank API token.
- `SYNC_INTERVAL`: The interval (in milliseconds) at which the application will sync transactions.
- `MONO_TO_ACTUAL_MAPPING_<monobank_account_last_4_digits>`: The mapping between Monobank accounts and Actual Finance accounts.
- `MONO_TO_ACTUAL_FOR_ALL`: If set to `true`, the application will sync all Monobank accounts, regardless of the mappings.

## Contributing

If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
