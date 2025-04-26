export default function AssessmentsPage() {
  return (
    <div className="p-6">
    
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pretest & Posttest Questions */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 10h8v2H8v-2zm0 4h8v2H8v-2zm10-8H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H6V8h12v12z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Pretest & Posttest Questions</h2>
        </div>

        {/* Activity Questions */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 10h8v2H8v-2zm0 4h8v2H8v-2zm10-8H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H6V8h12v12z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Activity Questions</h2>
        </div>

        {/* MC Question */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">MC Question</h2>
        </div>

        {/* Answer-Question */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Answer-Question</h2>
        </div>

        {/* Pretest Result */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Pretest Result</h2>
        </div>

        {/* Posttest Result */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Posttest Result</h2>
        </div>

        {/* Activity Dashboard */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Activity Dashboard</h2>
        </div>
      </div>
    </div>
  );
}
