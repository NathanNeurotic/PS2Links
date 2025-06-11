document.addEventListener('DOMContentLoaded', () => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.innerHTML = '<p style="color: green; text-align: center; padding: 20px; font-size: 20px;">Test message: script.js is running and can modify the main element!</p>';
    } else {
        alert('Test script ran, but <main> element not found!');
    }
    console.log('Simplified test script.js executed.');
});
