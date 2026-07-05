import React from 'react'

const Title = ({ title, subTitle, action }) => {
  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
      <div>
        <h1 className='text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl'>{title}</h1>
        {subTitle && <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-500'>{subTitle}</p>}
      </div>
      {action}
    </div>
  )
}

export default Title
