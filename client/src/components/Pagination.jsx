import React from 'react'

const Pagination = ({currentPage, totalPages, onPageChange, totalItems, pageSize}) => {
  if(!totalPages || totalPages <= 1) return null

  const safeCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages)
  const startPage = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4))
  const endPage = Math.min(totalPages, startPage + 4)
  const pages = Array.from({length: endPage - startPage + 1}, (_, index) => startPage + index)
  const startItem = totalItems && pageSize ? (safeCurrentPage - 1) * pageSize + 1 : null
  const endItem = totalItems && pageSize ? Math.min(safeCurrentPage * pageSize, totalItems) : null

  const goToPage = (page)=>{
    const nextPage = Math.min(Math.max(page, 1), totalPages)
    if(nextPage !== safeCurrentPage){
      onPageChange(nextPage)
    }
  }

  return (
    <nav className='mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row' aria-label='Pagination'>
      <p className='text-sm font-semibold text-slate-500'>
        {startItem && endItem ? `Showing ${startItem}-${endItem} of ${totalItems}` : `Page ${safeCurrentPage} of ${totalPages}`}
      </p>

      <div className='flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto'>
        <button
          type='button'
          disabled={safeCurrentPage === 1}
          onClick={()=> goToPage(safeCurrentPage - 1)}
          className='min-w-24 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
        >
          Previous
        </button>

        <div className='flex items-center gap-1'>
          {startPage > 1 && (
            <>
              <button type='button' onClick={()=> goToPage(1)} className='h-10 min-w-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary'>
                1
              </button>
              <span className='px-1 text-sm font-semibold text-slate-400'>...</span>
            </>
          )}

          {pages.map((page)=> (
            <button
              key={page}
              type='button'
              onClick={()=> goToPage(page)}
              aria-current={page === safeCurrentPage ? 'page' : undefined}
              className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${page === safeCurrentPage ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'}`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              <span className='px-1 text-sm font-semibold text-slate-400'>...</span>
              <button type='button' onClick={()=> goToPage(totalPages)} className='h-10 min-w-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary'>
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          type='button'
          disabled={safeCurrentPage === totalPages}
          onClick={()=> goToPage(safeCurrentPage + 1)}
          className='min-w-24 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
        >
          Next
        </button>
      </div>
    </nav>
  )
}

export default Pagination
