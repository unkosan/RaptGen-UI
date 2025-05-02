// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  Sequence: string[],
  Duplicates: number[],
  Random_Region: string[],
  coord_x: number[],
  coord_y: number[],
  class: number[],
} | {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { method } = req
  if (method === 'GET') {
    const response = await fetch("http://backend:8000/sample/sampledata");
    const data = await response.json();
    res.status(200).json(data);
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }

  // res.status(200).json({ name: 'John Doe' })
}
