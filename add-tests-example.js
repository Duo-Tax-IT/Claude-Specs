// Example: How to add custom benchmark tests to the AI Performance Monitor
// This file shows how to extend the benchmark test library

// Example of adding new tests to existing categories
const additionalTests = {
    'SQL_Database': [
        {
            question: "Optimize this query by adding an index hint:\nSELECT * FROM users WHERE email = 'john@example.com' AND status = 'active';",
            expectedAnswer: "SELECT * FROM users USE INDEX (idx_email_status) WHERE email = 'john@example.com' AND status = 'active';",
            description: "Add index hint to optimize SQL query"
        },
        {
            question: "Convert this subquery to use EXISTS:\nSELECT * FROM products WHERE category_id IN (SELECT id FROM categories WHERE name = 'Electronics');",
            expectedAnswer: "SELECT * FROM products p WHERE EXISTS (SELECT 1 FROM categories c WHERE c.id = p.category_id AND c.name = 'Electronics');",
            description: "Convert IN subquery to EXISTS"
        }
    ],

    'Bug_Identification': [
        {
            question: "Find the memory leak in this React component:\nfunction UserList() {\n    const [users, setUsers] = useState([]);\n    useEffect(() => {\n        const interval = setInterval(() => {\n            fetchUsers().then(setUsers);\n        }, 1000);\n    }, []);\n    return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>;\n}",
            expectedAnswer: "Missing cleanup function to clear interval in useEffect return",
            description: "Identify React useEffect cleanup issue"
        }
    ],

    'Code_Completion': [
        {
            question: "Complete this async/await error handling:\nasync function fetchUserData(id) {\n    try {\n        const response = await fetch(`/api/users/${id}`);\n        // Complete error handling and return\n    } catch (error) {\n        // Complete error handling\n    }\n}",
            expectedAnswer: "if (!response.ok) throw new Error('Failed to fetch'); return await response.json(); // In catch: console.error(error); throw error;",
            description: "Complete async function with proper error handling"
        }
    ],

    'Logic_Algorithm': [
        {
            question: "What's the space complexity of merge sort?",
            expectedAnswer: "O(n) - requires additional space for temporary arrays during merging",
            description: "Analyze merge sort space complexity"
        }
    ],

    'API_Integration': [
        {
            question: "Add proper authentication headers to this request:\nfetch('/api/protected-data')",
            expectedAnswer: "fetch('/api/protected-data', { headers: { 'Authorization': 'Bearer ' + token } })",
            description: "Add authentication header to API request"
        }
    ]
};

// Example of creating a completely new category
const newCategory = {
    'DevOps_Infrastructure': [
        {
            question: "Write a Docker command to run a container with port mapping:\nImage: my-app, Internal port: 3000, External port: 8080",
            expectedAnswer: "docker run -p 8080:3000 my-app",
            description: "Create Docker run command with port mapping"
        },
        {
            question: "What's the correct Kubernetes command to scale a deployment?\nDeployment name: web-app, Scale to: 5 replicas",
            expectedAnswer: "kubectl scale deployment web-app --replicas=5",
            description: "Scale Kubernetes deployment"
        },
        {
            question: "Write a basic Nginx location block to proxy requests:\nProxy to: http://localhost:3000, Path: /api/",
            expectedAnswer: "location /api/ { proxy_pass http://localhost:3000; }",
            description: "Configure Nginx reverse proxy"
        }
    ]
};

// To integrate these tests, you would modify the initializeBenchmarkTests() method
// in ai-monitor.js to include these additional tests:

/*
initializeBenchmarkTests() {
    const baseTests = {
        // ... existing tests ...
    };
    
    // Add new tests to existing categories
    Object.keys(additionalTests).forEach(category => {
        if (baseTests[category]) {
            baseTests[category].push(...additionalTests[category]);
        }
    });
    
    // Add new categories
    Object.keys(newCategory).forEach(category => {
        baseTests[category] = newCategory[category];
    });
    
    return baseTests;
}
*/

// Tips for creating good benchmark tests:
// 1. Make questions specific and clear
// 2. Include code examples when relevant
// 3. Keep expected answers concise but complete
// 4. Write descriptive test descriptions
// 5. Test a single concept per question
// 6. Vary difficulty levels within categories

console.log('This is an example file showing how to add custom tests.');
console.log('Modify ai-monitor.js directly to integrate these tests.');
console.log('Categories included in examples:');
console.log('- Additional tests for existing categories');
console.log('- New DevOps/Infrastructure category');
console.log('\nSee comments in this file for integration instructions.'); 