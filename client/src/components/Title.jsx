import React from 'react'

const Title = ({title, subTitle, align = 'center'}) => {
  const isLeft = align === 'left'
  return (
    <div className={isLeft ? 'text-left' : 'mx-auto max-w-3xl text-center'}>
      <p className='mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary'>DriveSphere</p>
      <h2 className='text-3xl font-semibold text-slate-950 md:text-5xl'>{title}</h2>
      {subTitle && <p className={`mt-4 text-base leading-7 text-slate-500 ${isLeft ? 'max-w-2xl' : 'mx-auto max-w-2xl'}`}>{subTitle}</p>}
    </div>
  )
}

export default Title
